import fs from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { type FastifyInstance } from 'fastify';

import sqlite from '@database/driver/sqlite';

import build from '../../app/app';

jest.unmock('@database/driver/sqlite');

describe('GET /1/woki/bookigns/day', () => {
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

    mem.exec(/* sql */ `DELETE FROM bookings WHERE true`);
    // booked_tables will be cleaned up by foreign key constraint
  });

  afterEach(async () => {
    await Promise.all([server.close(), mem.close()]);
  });

  it('Should return bookings for a given day', async () => {
    mem.exec(/* sql */ `
			INSERT INTO bookings
				( id, restaurant_id, sector_id, party_size, start, end, duration_minutes, status, created_at, updated_at ) VALUES
				( 'BK_001', 'R1', 'S1', 3,
					'2025-10-22 23:30:00', '2025-10-23 00:15:00', 45, 'CONFIRMED',
					'2025-10-22 21:00:00', '2025-10-22 21:00:00' );

			INSERT INTO booked_tables VALUES ( 'BK_001', 'T2' );
		`);

    sqlite.inject(mem);
    const response = await server.inject({
      method: 'GET',
      url: '/1/woki/bookings/day',
      query: {
        restaurantId: 'R1',
        sectorId: 'S1',
        date: '2025-10-22',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(
      'application/json; charset=utf-8'
    );
    expect(response.json()).toEqual({
      date: '2025-10-22',
      items: [
        {
          id: 'BK_001',
          tableIds: ['T2'],
          partySize: 3,
          start: '2025-10-22T20:30:00-03:00',
          end: '2025-10-22T21:15:00-03:00',
          status: 'CONFIRMED',
        },
      ],
    });
  });

  it("Shouldn't find any bookings available", async () => {
    sqlite.inject(mem);
    const response = await server.inject({
      method: 'GET',
      url: '/1/woki/bookings/day',
      query: {
        restaurantId: 'R1',
        sectorId: 'S1',
        date: '2025-10-22',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe(
      'application/json; charset=utf-8'
    );
    expect(response.json()).toEqual({
      date: '2025-10-22',
      items: [],
    });
  });

  it('Should throw an exception due to date type mismatch', async () => {
    sqlite.inject(mem);
    const response = await server.inject({
      method: 'GET',
      url: '/1/woki/bookings/day',
      query: {
        restaurantId: 'R1',
        sectorId: 'S1',
        date: '20251022',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toBe(
      'application/json; charset=utf-8'
    );
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'bad_request',
        detail: expect.arrayContaining([
          expect.objectContaining({
            code: 'invalid_format',
            message: expect.stringContaining('Invalid date format'),
          }),
        ]),
      })
    );
  });
});
