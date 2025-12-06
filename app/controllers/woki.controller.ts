import { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';

import type { ScoredGap } from '@domain/wokibrain';
import redis from '@database/driver/redis';
import sqlite from '@database/driver/sqlite';
import { discover } from '@domain/gaps';
import { rank } from '@domain/wokibrain';
import Exception from '@exceptions/index';
import dayjs from '@lib/addons/dayjs';
import HttpStatus from '@lib/consts/HttpStatus';
import Clock from '@lib/prototypes/clock';
import mutex from '@lib/utils/mutex';
import withDefault from '@lib/utils/withDefault';
import RequestValidations from '@validations/request.validations';

import '@lib/prototypes/array';

export default class WokiController {
  public static async discover(req: FastifyRequest, reply: FastifyReply) {
    try {
      const {
        restaurantId,
        sectorId,
        date,
        partySize,
        duration,
        windowStart = undefined,
        windowEnd = undefined,
        limit = 10,
      } = RequestValidations.DiscoverQuery.parse(req.query);

      const timeZone = (sqlite
        .prepare(/*sql*/ `SELECT timezone FROM restaurants WHERE id = ?`)
        .get(restaurantId)?.timezone || 'UTC') as string;

      const openHours = sqlite
        .prepare(
          /*sql*/ `SELECT start, end FROM windows WHERE restaurant_id = ?`
        )
        .all(restaurantId)
        .map(Object.values) as unknown as Array<
        Tuple<[Clock.Time, Clock.Time]>
      >;

      const closedHours = Clock.slotDiff(openHours);
      const isClosed = closedHours.some(([start, end]) => {
        if (windowStart && windowEnd) {
          return (
            (start === null || windowEnd > start) &&
            (end === null || windowStart < end)
          );
        } else if (windowStart) {
          return end === null || windowStart < end;
        } else if (windowEnd) {
          return start === null || windowEnd > start;
        } else {
          return false;
        }
      });

      if (isClosed) {
        throw new Exception.OutOfWindow();
      }

      const [defaultWindowStartTime] = openHours.at(0)!;
      const [, defaultWindowEndTime] = openHours.at(-1)!;

      const defaultStartTime = withDefault(
        windowStart,
        defaultWindowStartTime
      ) as Clock.Time;
      const defaultEndTime = withDefault(
        windowEnd,
        defaultWindowEndTime
      ) as Clock.Time;

      const start = Clock.replaceTime(
        dayjs(date, 'YYYY-MM-DD'),
        defaultStartTime,
        timeZone
      );
      const end = Clock.replaceTime(
        dayjs(date, 'YYYY-MM-DD'),
        defaultEndTime,
        timeZone
      );

      const exclude: Array<Tuple<[dayjs.Dayjs, dayjs.Dayjs]>> = closedHours
        // remove leading/trailing nulls
        .slice(1, -1)
        .map(([s, e]) => [
          Clock.replaceTime(dayjs(date, 'YYYY-MM-DD'), s!, timeZone),
          Clock.replaceTime(dayjs(date, 'YYYY-MM-DD'), e!, timeZone),
        ]);

      const slots = Clock.slots(duration, {
        tz: timeZone,
        include: [start, end],
        exclude,
      });

      const candidates: Array<ScoredGap> = [];

      await Promise.all(
        slots.map(([startDate, endDate]) => {
          const gap = discover({
            restaurantId,
            sectorId,
            partySize,
            startDate: dayjs(startDate).utc().format('YYYY-MM-DD HH:mm:ss'),
            endDate: dayjs(endDate).utc().format('YYYY-MM-DD HH:mm:ss'),
          });

          if (gap.length > 0) {
            candidates.push(...rank(gap, partySize));
          }
        })
      );

      if (candidates.length <= 0) {
        throw new Exception.NoCapacity();
      }

      reply.code(200).send({
        slotMinutes: duration,
        durationMinutes: duration,
        candidates: candidates
          .map(({ startDate, endDate, ...candidate }) => ({
            ...candidate,
            start: dayjs.utc(startDate).tz(timeZone).format(),
            end: dayjs.utc(endDate).tz(timeZone).format(),
          }))
          .limit(limit)
          .sortBy('score', 'DESC'),
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        reply.code(HttpStatus.BadRequest).send({
          error: 'bad_request',
          detail: e.issues,
        });
      } else if (e instanceof Exception.OutOfWindow) {
        reply.code(HttpStatus.UnprocessableEntity).send({
          error: 'outside_service_window',
          detail: 'Window does not intersect service hours',
        });
      } else if (e instanceof Exception.NoCapacity) {
        reply.code(HttpStatus.Conflict).send({
          error: 'no_capacity',
          detail: 'No single or combo gap fits duration within window',
        });
      } else {
        // Unexpected error
        req.log.error(e);
        reply.code(HttpStatus.InternalServerError).send();
      }
    }
  }

  public static async book(req: FastifyRequest, reply: FastifyReply) {
    const idempotencyKey = req.headers['idempotency-key'];

    try {
      const {
        restaurantId,
        sectorId,
        partySize,
        duration,
        date,
        windowStart,
        windowEnd,
      } = RequestValidations.BookBody.parse(req.body);

      if (!idempotencyKey) {
        throw new Exception.MissingIdempotencyKey();
      }

      const cached = await redis.get(`idempotency:${idempotencyKey}`);
      if (cached) {
        reply
          .status(200)
          .header('Idempotency-Replay', 'true')
          .send(JSON.parse(cached));
        return;
      }

      const timeZone = (sqlite
        .prepare(/*sql*/ `SELECT timezone FROM restaurants WHERE id = ?`)
        .get(restaurantId)?.timezone || 'UTC') as string;

      const openHours = sqlite
        .prepare(
          /*sql*/ `SELECT start, end FROM windows WHERE restaurant_id = ?`
        )
        .all(restaurantId)
        .map(Object.values) as unknown as Array<
        Tuple<[Clock.Time, Clock.Time]>
      >;

      const closedHours = Clock.slotDiff(openHours);
      const isClosed = closedHours.some(([start, end]) => {
        if (windowStart && windowEnd) {
          return (
            (start === null || windowEnd > start) &&
            (end === null || windowStart < end)
          );
        } else if (windowStart) {
          return end === null || windowStart < end;
        } else if (windowEnd) {
          return start === null || windowEnd > start;
        } else {
          return false;
        }
      });

      if (isClosed) {
        throw new Exception.OutOfWindow();
      }

      const start = Clock.replaceTime(
        dayjs(date, 'YYYY-MM-DD'),
        windowStart as Clock.Time,
        timeZone
      );
      const end = Clock.replaceTime(
        dayjs(date, 'YYYY-MM-DD'),
        windowEnd as Clock.Time,
        timeZone
      );

      const exclude: Array<Tuple<[dayjs.Dayjs, dayjs.Dayjs]>> = closedHours
        // remove leading/trailing nulls
        .slice(1, -1)
        .map(([s, e]) => [
          Clock.replaceTime(dayjs(date, 'YYYY-MM-DD'), s!, timeZone),
          Clock.replaceTime(dayjs(date, 'YYYY-MM-DD'), e!, timeZone),
        ]);

      const slots = Clock.slots(duration, {
        tz: timeZone,
        include: [start, end],
        exclude,
      });

      const candidates: ScoredGap[] = [];

      await Promise.all(
        slots.map(([startDate, endDate]) => {
          const gap = discover({
            restaurantId,
            sectorId,
            partySize,
            startDate: dayjs(startDate).utc().format('YYYY-MM-DD HH:mm:ss'),
            endDate: dayjs(endDate).utc().format('YYYY-MM-DD HH:mm:ss'),
          });

          if (gap.length > 0) {
            candidates.push(...rank(gap, partySize));
          }
        })
      );

      const combos = candidates.sortBy('score', 'DESC');

      if (combos.length <= 0) {
        throw new Exception.NoCapacity();
      }

      const candidate = combos[0];

      const lockKey =
        `${restaurantId}` +
        `|${sectorId}` +
        `|${candidate.tableIds.join('+')}` +
        `|${candidate.startDate}`;

      const lock = await mutex.Lock(lockKey);
      await lock.acquire();

      const { count } = sqlite
        .prepare(
          /*sql*/ `
					SELECT COUNT(1) as count
					FROM bookings
				`
        )
        .get() as { count: number };

      sqlite.exec('BEGIN;');
      const stmt1 = sqlite.prepare(/*sql*/ `
	      INSERT INTO bookings (
	        id,
	        restaurant_id,
	        sector_id,
	        party_size,
	        start,
	        end,
	        duration_minutes,
	        status,
	        created_at,
	        updated_at
	      ) VALUES (
	        :id,
	        :restaurantId,
	        :sectorId,
	        :partySize,
	        :start,
	        :end,
	        :duration,
	        'CONFIRMED',
	        DATETIME('now'),
	        DATETIME('now')
	      );
			`);

      const stmpt2 = sqlite.prepare(/*sql*/ `
				INSERT INTO booked_tables ( booking_id, table_id )
				VALUES ( :bookingId, :tableId );
			`);

      const newId = `BK_${String(count + 1).padStart(3, '0')}`;

      const booking = {
        id: newId,
        restaurantId,
        sectorId,
        partySize,
        start: start.utc().format('YYYY-MM-DD HH:mm:ss'),
        end: end.utc().format('YYYY-MM-DD HH:mm:ss'),
        duration,
      };

      const { lastInsertRowid } = stmt1.run(booking);

      if (!lastInsertRowid) {
        throw new Error('Failed to create booking');
      }

      await Promise.all(
        candidate.tableIds.map((tableId) =>
          Promise.resolve(stmpt2.run({ bookingId: newId, tableId }))
        )
      );
      sqlite.exec('COMMIT;');

      const response = {
        ...booking,
        start: dayjs.utc(candidate.startDate).tz(timeZone).format(),
        end: dayjs.utc(candidate.endDate).tz(timeZone).format(),
        tableIds: candidate.tableIds,
      };

      await redis.set(
        `idempotency:${idempotencyKey}`,
        JSON.stringify(response),
        'EX',
        mutex.IDEMPOTENCY_TTL
      );

      await mutex.release(lockKey);
      reply.code(201).send(response);
    } catch (e) {
      sqlite.exec('ROLLBACK;');
      if (e instanceof z.ZodError) {
        reply.code(400).send({
          error: 'bad_request',
          detail: e.issues,
        });
      } else if (e instanceof Exception.Mutex) {
        reply.code(409).send({
          error: 'conflict',
          detail:
            'Another booking is being processed with the same Idempotency-Key',
        });
      } else if (e instanceof Exception.MissingIdempotencyKey) {
        reply.code(400).send({
          error: 'missing_idempotency_key',
          detail: 'Idempotency-Key header is required',
        });
      } else if (e instanceof Exception.OutOfWindow) {
        reply.code(422).send({
          error: 'outside_service_window',
          detail: 'Window does not intersect service hours',
        });
      } else if (e instanceof Exception.NoCapacity) {
        reply.code(409).send({
          error: 'no_capacity',
          detail: 'No single or combo gap fits duration within window',
        });
      } else {
        // Unexpected error
        req.log.error(e);
        reply.code(500).send();
      }
    }
  }

  public static day(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { restaurantId, sectorId, date } =
        RequestValidations.DayQuery.parse(req.query);

      const stmt = sqlite.prepare(/*sql*/ `
    		SELECT
					b.id,
					GROUP_CONCAT(bt.table_id) AS tableIds,
					b.party_size as partySize,
					b.start,
					b.end,
					b.status
				FROM bookings b
				INNER JOIN booked_tables bt ON b.id = bt.booking_id
				WHERE b.restaurant_id = :restaurantId
					AND b.sector_id = :sectorId
					AND DATE(b.start) = DATE(:date)
				GROUP BY b.id
			`);

      const bookings = stmt.all({ restaurantId, sectorId, date }).map((b) => ({
        ...b,
        tableIds: (b.tableIds as string).split(','),
      })) as Array<Bookings>;

      reply.code(HttpStatus.Ok).send({ date, items: bookings });
    } catch (e) {
      if (e instanceof z.ZodError) {
        reply.code(HttpStatus.BadRequest).send({
          error: 'bad_request',
          detail: e.issues,
        });
      } else {
        // Unexpected error
        req.log.error(e);
        reply.code(HttpStatus.InternalServerError).send();
      }
    }
  }

  public static cancel(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = RequestValidations.CancelParams.parse(req.params);

      const exists = sqlite
        .prepare(`SELECT 1 FROM bookings WHERE id = ?`)
        .get(id);

      if (!exists) {
        throw new Exception.NotFound();
      }

      const stmt = sqlite.prepare(/*sql*/ `DELETE FROM bookings WHERE id = ?`);
      stmt.run(id);

      reply.code(HttpStatus.NoContent).send();
    } catch (e) {
      if (e instanceof Exception.NotFound) {
        reply.code(HttpStatus.NotFound).send();
      } else if (e instanceof z.ZodError) {
        reply.code(HttpStatus.BadRequest).send({
          error: 'bad_request',
          detail: e.issues,
        });
      } else {
        // Unexpected error
        req.log.error(e);
        reply.code(HttpStatus.InternalServerError).send();
      }
    }
  }
}
