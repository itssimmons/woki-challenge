import { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';

import sqlite from '@database/driver/sqlite';
import { discover } from '@domain/gaps';
import { rank } from '@domain/wokibrain';
import Exception from '@exceptions/index';
import dayjs from '@lib/addons/dayjs';
import HttpStatus from '@lib/consts/HttpStatus';
import Clock from '@lib/prototypes/clock';
import withDefault from '@lib/utils/withDefault';
import RequestValidations from '@validations/request.validations';

import '@lib/prototypes/array';

// type BookBody = {
//   restaurantId: ID;
//   sectorId: ID;
//   partySize: number;
//   durationMinutes: number;
//   date: string;
//   windowStart: string;
//   windowEnd: string;
// };

export default class WokiController {
  public static discover(req: FastifyRequest, reply: FastifyReply) {
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

      const candidates = [];

      for (const [startDate, endDate] of slots) {
        const gap = discover({
          restaurantId,
          sectorId,
          partySize,
          startDate: startDate,
          endDate: endDate,
        });

        if (gap.length > 0) {
          candidates.push(...rank(gap, partySize));
        }
      }

      if (candidates.length <= 0) {
        throw new Exception.NoCapacity();
      }

      reply.code(200).send({
        slotMinutes: duration,
        durationMinutes: duration,
        candidates: candidates.limit(limit).sortBy('score', 'DESC'),
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

  public static book(req: FastifyRequest, reply: FastifyReply) {
    // const {
    //   restaurantId,
    //   sectorId,
    //   partySize,
    //   durationMinutes,
    //   date,
    //   windowStart,
    //   windowEnd,
    // } = req.body as BookBody;

    // const IdempotencyKey = req.headers['Idempotency-Key'] as string | undefined;

    try {
      // acquire lock here
      reply.code(201).send({
        id: 'BK_001',
        restaurantId: 'R1',
        sectorId: 'S1',
        tableIds: ['T4'],
        partySize: 5,
        start: '2025-10-22T20:00:00-03:00',
        end: '2025-10-22T21:30:00-03:00',
        durationMinutes: 90,
        status: 'CONFIRMED',
        createdAt: '2025-10-22T19:50:21-03:00',
        updatedAt: '2025-10-22T19:50:21-03:00',
      });
    } catch (e) {
      if (e instanceof Exception.NoCapacity) {
        reply.code(409).send({
          error: 'no_capacity',
          detail: 'No single or combo gap fits duration within window',
        });
      } else {
        // Unexpected error
        req.log.error(e);
        reply.code(500).send();
      }
    } finally {
      // release lock here
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
