import fs from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { type FastifyInstance } from 'fastify';

import sqlite from '@database/driver/sqlite';

import build from '../../app/app';

jest.unmock('@database/driver/sqlite');

describe('GET /1/woki/discover', () => {
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

  it('Should offer a happy single table', async () => {
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
    const response = await server.inject({
      method: 'GET',
      url: '/1/woki/discover',
      query: {
        restaurantId: 'R1',
        sectorId: 'S1',
        date: '2025-10-22',
        partySize: '4',
        duration: '60',
        windowStart: '10:00',
        windowEnd: '11:00',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(
      'application/json; charset=utf-8'
    );
    expect(response.json().candidates).toHaveLength(1);
    expect(response.json()).toEqual({
      slotMinutes: 60,
      durationMinutes: 60,
      candidates: [
        {
          score: 10,
          maxSize: 4,
          kind: expect.stringMatching('single'),
          tableIds: expect.arrayContaining(['T1']),
          start: expect.stringMatching('2025-10-22T10:00:00Z'),
          end: expect.stringMatching('2025-10-22T11:00:00Z'),
          sectorId: 'S1',
          minSize: 2,
        },
      ],
    });
  });

  it('Should offer 1 single, and 2 combo candidates: (T1) (T2+T3) (T4+T5+T6)', async () => {
    mem.exec(/* sql */ `
    INSERT INTO restaurants ( id, name, timezone, created_at, updated_at ) VALUES
    ( 'R1', 'Resto', 'GMT', DATETIME('now'), DATETIME('now') );
    
    INSERT INTO sectors ( id, restaurant_id, name, created_at, updated_at ) VALUES
    ( 'S1', 'R1', 'Sector', DATETIME('now'), DATETIME('now') );
    
    INSERT INTO windows ( restaurant_id, start, end ) VALUES
    ( 'R1', '10:00', '11:00' );

    INSERT INTO tables ( id, sector_id, name, min_size, max_size, created_at, updated_at ) VALUES
    ( 'T1', 'S1', 'Table 1', 2, 6, DATETIME('now'), DATETIME('now') ),
    ( 'T2', 'S1', 'Table 2', 2, 3, DATETIME('now'), DATETIME('now') ),
		( 'T3', 'S1', 'Table 3', 2, 3, DATETIME('now'), DATETIME('now') ),
		( 'T4', 'S1', 'Table 4', 2, 2, DATETIME('now'), DATETIME('now') ),
		( 'T5', 'S1', 'Table 5', 2, 2, DATETIME('now'), DATETIME('now') ),
		( 'T6', 'S1', 'Table 6', 2, 2, DATETIME('now'), DATETIME('now') );
		`);

    sqlite.inject(mem);
    const response = await server.inject({
      method: 'GET',
      url: '/1/woki/discover',
      query: {
        restaurantId: 'R1',
        sectorId: 'S1',
        date: '2025-10-22',
        partySize: '6',
        duration: '60',
        windowStart: '10:00',
        windowEnd: '11:00',
        limit: '3',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(
      'application/json; charset=utf-8'
    );
    expect(response.json().candidates).toHaveLength(3);
    expect(response.json()).toEqual({
      slotMinutes: 60,
      durationMinutes: 60,
      candidates: [
        {
          score: 10,
          maxSize: 6,
          kind: expect.stringMatching('single'),
          tableIds: expect.arrayContaining(['T1']),
          start: expect.stringMatching('2025-10-22T10:00:00Z'),
          end: expect.stringMatching('2025-10-22T11:00:00Z'),
          sectorId: 'S1',
          minSize: 2,
        },
        {
          score: 10,
          maxSize: 6,
          kind: expect.stringMatching('combo'),
          tableIds: expect.arrayContaining(['T2', 'T3']),
          start: expect.stringMatching('2025-10-22T10:00:00Z'),
          end: expect.stringMatching('2025-10-22T11:00:00Z'),
          sectorId: 'S1',
          minSize: 4,
        },
        {
          score: 10,
          maxSize: 6,
          kind: expect.stringMatching('combo'),
          tableIds: expect.arrayContaining(['T4', 'T5', 'T6']),
          start: expect.stringMatching('2025-10-22T10:00:00Z'),
          end: expect.stringMatching('2025-10-22T11:00:00Z'),
          sectorId: 'S1',
          minSize: 6,
        },
      ],
    });
  });

  it('Should failed due to missing parameters', async () => {
    sqlite.inject(mem);

    const response = await server.inject({
      method: 'GET',
      url: '/1/woki/discover',
      query: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toBe(
      'application/json; charset=utf-8'
    );
    expect(response.json()).toEqual({
      error: 'bad_request',
      detail: expect.any(Array),
    });
  });

  it("Shouldn't offer tables when the restaurant is closed", async () => {
    mem.exec(/* sql */ `
		INSERT INTO restaurants ( id, name, timezone, created_at, updated_at ) VALUES
		( 'R1', 'Resto', 'GMT', DATETIME('now'), DATETIME('now') );
		
		INSERT INTO windows ( restaurant_id, start, end ) VALUES
		( 'R1', '10:00', '11:00' ),
		( 'R1', '12:00', '13:00' );
		`);

    sqlite.inject(mem);

    const hours = [
      // Closed at openening time < 10:00
      ['09:00', '10:00'],
      // Closed at rest time (11:00 - 12:00)
      ['11:00', '12:00'],
      // Closed at closing time > 13:00
      ['13:00', '14:00'],
    ];

    await Promise.all(
      hours.map(async ([start, end]) => {
        const response = await server.inject({
          method: 'GET',
          url: '/1/woki/discover',
          query: {
            restaurantId: 'R1',
            sectorId: 'S1',
            date: '2025-10-22',
            partySize: '6',
            duration: '60',
            windowStart: start,
            windowEnd: end,
          },
        });

        expect(response.statusCode).toBe(422);
        expect(response.json()).toStrictEqual({
          error: 'outside_service_window',
          detail: 'Window does not intersect service hours',
        });
      })
    );
  });
});
