import fs from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { type FastifyInstance } from 'fastify';
import MockRedis from 'ioredis-mock';

import sqlite from '@database/driver/sqlite';
import wait from '@lib/utils/wait';

import build from '../../app/app';

jest.unmock('@database/driver/sqlite');
jest.mock('@database/driver/redis', () => {
  return {
    createClient: () => new MockRedis(),
  };
});
jest.mock('@lib/utils/mutex', () => {
  const original = jest.requireActual('@lib/utils/mutex');

  const mutated = {
    ...original.default,
    IDEMPOTENCY_TTL: 1,
    LOCK_TTL: 1,
  };

  return {
    __esModule: true,
    default: mutated,
  };
});

describe('POST /1/woki/bookings', () => {
  let mem: DatabaseSync;
  let server: FastifyInstance;

  beforeEach(async () => {
    server = await build();
    mem = new DatabaseSync(':memory:');

    for await (const sql of fs.glob(
      `${__dirname}/../../app/database/migrations/*.sql`
    )) {
      const rawQuery = await fs.readFile(sql, { encoding: 'utf-8' });
      mem.exec(rawQuery);
    }

    for await (const sql of fs.glob(
      `${__dirname}/../../app/database/seeders/*.sql`
    )) {
      const rawQuery = await fs.readFile(sql, { encoding: 'utf-8' });
      mem.exec(rawQuery);
    }

    mem.exec(/* sql */ `
    DELETE FROM restaurants WHERE true;
    DELETE FROM windows WHERE true;
    DELETE FROM tables WHERE true;
    DELETE FROM bookings WHERE true;
    `);
    // booked_tables & sectors will be cleaned up by foreign key constraint
  });

  afterEach(async () => {
    await Promise.all([server.close(), mem.close()]);
  });

  it('Should return the same response using same Idempotency-Key header for at least 60s', async () => {
    mem.exec(/* sql */ `
    INSERT INTO restaurants ( id, name, timezone, created_at, updated_at ) VALUES
    ( 'R1', 'Resto', 'GMT', DATETIME('now'), DATETIME('now') );
    
    INSERT INTO sectors ( id, restaurant_id, name, created_at, updated_at ) VALUES
    ( 'S1', 'R1', 'Sector', DATETIME('now'), DATETIME('now') );
    
    INSERT INTO windows ( restaurant_id, start, end ) VALUES
    ( 'R1', '10:00', '11:00' );

    INSERT INTO tables ( id, sector_id, name, min_size, max_size, created_at, updated_at ) VALUES
    ( 'T1', 'S1', 'Table 1', 2, 4, DATETIME('now'), DATETIME('now') );
		`);

    sqlite.inject(mem);

    const uniqueKey = 'unique-key-123';
    const payload = {
      restaurantId: 'R1',
      sectorId: 'S1',
      date: '2025-10-22',
      partySize: '4',
      duration: '60',
      windowStart: '10:00',
      windowEnd: '11:00',
    };
    const sameResponse = {
      id: expect.any(String),
      duration: 60,
      restaurantId: 'R1',
      sectorId: 'S1',
      partySize: 4,
      tableIds: expect.arrayContaining(['T1']),
      start: expect.stringMatching('2025-10-22T10:00:00Z'),
      end: expect.stringMatching('2025-10-22T11:00:00Z'),
    };

    const r1 = await server.inject({
      method: 'POST',
      url: '/1/woki/bookings',
      headers: {
        'idempotency-key': uniqueKey,
        'content-type': 'application/json',
      },
      body: payload,
    });

    expect(r1.statusCode).toBe(201);
    expect(r1.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(r1.json()).toEqual(sameResponse);

    await wait(500);

    const r2 = await server.inject({
      method: 'POST',
      url: '/1/woki/bookings',
      headers: {
        'idempotency-key': uniqueKey,
        'content-type': 'application/json',
      },
      body: payload,
    });

    expect(r2.statusCode).toBe(200);
    expect(r2.headers['idempotency-replay']).toBe('true');
    expect(r2.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(r2.json()).toEqual(sameResponse);

    await wait(501); // +501ms (total 1s)

    const r3 = await server.inject({
      method: 'POST',
      url: '/1/woki/bookings',
      headers: {
        'idempotency-key': uniqueKey,
        'content-type': 'application/json',
      },
      body: payload,
    });

    expect(r3.statusCode).toBe(409);
    expect(r3.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(r3.json()).toStrictEqual({
      error: 'no_capacity',
      detail: 'No single or combo gap fits duration within window',
    });
  });

  // [start, end)
  it('Should offer a table combo for 8 when prior booking ends at window start', async () => {
    mem.exec(/* sql */ `
    INSERT INTO restaurants ( id, name, timezone, created_at, updated_at ) VALUES
    ( 'R1', 'Resto', 'GMT', DATETIME('now'), DATETIME('now') );
    
    INSERT INTO sectors ( id, restaurant_id, name, created_at, updated_at ) VALUES
    ( 'S1', 'R1', 'Sector', DATETIME('now'), DATETIME('now') );
    
    INSERT INTO windows ( restaurant_id, start, end ) VALUES
    ( 'R1', '10:00', '12:00' );

    INSERT INTO tables ( id, sector_id, name, min_size, max_size, created_at, updated_at ) VALUES
    ( 'T1', 'S1', 'Table 1', 2, 4, DATETIME('now'), DATETIME('now') ),
    ( 'T2', 'S1', 'Table 2', 2, 4, DATETIME('now'), DATETIME('now') );
    
		INSERT INTO bookings
			(id, restaurant_id, sector_id, party_size, start, end, duration_minutes, status, created_at, updated_at) VALUES
			( 'BK_001', 'R1', 'S1', 8, '2025-10-22 10:00:00', '2025-10-22 11:00:00', 60, 'CONFIRMED', DATETIME('now'), DATETIME('now') );

		INSERT INTO booked_tables VALUES ( 'BK_001', 'T1' ), ( 'BK_001', 'T2' );
		`);

    sqlite.inject(mem);
    const response = await server.inject({
      method: 'POST',
      url: '/1/woki/bookings',
      headers: {
        'idempotency-key': 'unique-key-456',
        'content-type': 'application/json',
      },
      body: {
        restaurantId: 'R1',
        sectorId: 'S1',
        date: '2025-10-22',
        partySize: '8',
        duration: '60',
        windowStart: '11:00',
        windowEnd: '12:00',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.headers['content-type']).toBe(
      'application/json; charset=utf-8'
    );
    expect(response.json()).toEqual({
      id: expect.any(String),
      duration: 60,
      restaurantId: 'R1',
      sectorId: 'S1',
      partySize: 8,
      tableIds: expect.arrayContaining(['T1', 'T2']),
      start: expect.stringMatching('2025-10-22T11:00:00Z'),
      end: expect.stringMatching('2025-10-22T12:00:00Z'),
    });
  });

  it('Should offer a table, an declined the same one to another requester due race condition', async () => {
    mem.exec(/* sql */ `
    INSERT INTO restaurants ( id, name, timezone, created_at, updated_at ) VALUES
    ( 'R1', 'Resto', 'GMT', DATETIME('now'), DATETIME('now') );
    
    INSERT INTO sectors ( id, restaurant_id, name, created_at, updated_at ) VALUES
    ( 'S1', 'R1', 'Sector', DATETIME('now'), DATETIME('now') );
    
    INSERT INTO windows ( restaurant_id, start, end ) VALUES
    ( 'R1', '10:00', '11:00' );

    INSERT INTO tables ( id, sector_id, name, min_size, max_size, created_at, updated_at ) VALUES
    ( 'T1', 'S1', 'Table 1', 2, 4, DATETIME('now'), DATETIME('now') );
    `);

    sqlite.inject(mem);

    const payload = {
      restaurantId: 'R1',
      sectorId: 'S1',
      date: '2025-10-22',
      partySize: '4',
      duration: '60',
      windowStart: '10:00',
      windowEnd: '11:00',
    };

    const settled = await Promise.all([
      server.inject({
        method: 'POST',
        url: '/1/woki/bookings',
        headers: {
          'idempotency-key': 'unique-key-789',
          'content-type': 'application/json',
        },
        body: payload,
      }),
      server.inject({
        method: 'POST',
        url: '/1/woki/bookings',
        headers: {
          'idempotency-key': 'unique-key-790',
          'content-type': 'application/json',
        },
        body: payload,
      }),
    ]);

    expect(settled).toHaveLength(2);
    expect(settled.map((r) => r.statusCode).sort()).toStrictEqual(
      [201, 409].sort()
    );
  });
});
