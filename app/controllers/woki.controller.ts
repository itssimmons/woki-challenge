import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

import sqlite from "@database/driver/sqlite";
import Exception from "@exceptions/index";
import HttpStatus from "@lib/consts/HttpStatus";
import RequestValidations from "@validations/request.validations";

type DiscoverQuery = {
  restaurantId: ID;
  sectorId: ID;
  date: Timestamp;
  partySize: number;
  duration: number;
  windowStart?: string;
  windowEnd?: string;
  limit?: number;
};

type BookBody = {
  restaurantId: ID;
  sectorId: ID;
  partySize: number;
  durationMinutes: number;
  date: string;
  windowStart: string;
  windowEnd: string;
};

type Bookings = {
  id: ID;
  tableIds: Array<ID>;
  partySize: number;
  start: Timestamp;
  end: Timestamp;
  status: string;
};

export default class WokiController {
  public static discover(req: FastifyRequest, reply: FastifyReply) {
    const {
      restaurantId,
      sectorId,
      date,
      partySize,
      duration,
      windowStart,
      windowEnd,
      limit,
    } = req.query as DiscoverQuery;

    try {
      reply.code(200).send({
        slotMinutes: 15,
        durationMinutes: 90,
        candidates: [
          {
            kind: "single",
            tableIds: ["T4"],
            start: "2025-10-22T20:00:00-03:00",
            end: "2025-10-22T21:30:00-03:00",
          },
          {
            kind: "combo",
            tableIds: ["T2", "T3"],
            start: "2025-10-22T20:15:00-03:00",
            end: "2025-10-22T21:45:00-03:00",
          },
        ],
      });
    } catch (e) {
      if (e instanceof Exception.OutOfWindow) {
        reply.code(400).send({
          error: "outside_service_window",
          detail: "Window does not intersect service hours",
        });
      } else if (e instanceof Exception.NoCapacity) {
        reply.code(409).send({
          error: "no_capacity",
          detail: "No single or combo gap fits duration within window",
        });
      } else {
        // Unexpected error
        req.log.error(e);
        reply.code(500).send();
      }
    }
  }

  public static book(req: FastifyRequest, reply: FastifyReply) {
    const {
      restaurantId,
      sectorId,
      partySize,
      durationMinutes,
      date,
      windowStart,
      windowEnd,
    } = req.body as BookBody;

    const IdempotencyKey = req.headers["Idempotency-Key"] as string | undefined;

    try {
      // acquire lock here
      reply.code(201).send({
        id: "BK_001",
        restaurantId: "R1",
        sectorId: "S1",
        tableIds: ["T4"],
        partySize: 5,
        start: "2025-10-22T20:00:00-03:00",
        end: "2025-10-22T21:30:00-03:00",
        durationMinutes: 90,
        status: "CONFIRMED",
        createdAt: "2025-10-22T19:50:21-03:00",
        updatedAt: "2025-10-22T19:50:21-03:00",
      });
    } catch (e) {
      if (e instanceof Exception.NoCapacity) {
        reply.code(409).send({
          error: "no_capacity",
          detail: "No single or combo gap fits duration within window",
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
        tableIds: (b.tableIds as string).split(","),
      })) as Array<Bookings>;

      reply.code(HttpStatus.Ok).send({ date, items: bookings });
    } catch (e) {
      if (e instanceof z.ZodError) {
        reply.code(HttpStatus.BadRequest).send({
          error: "bad_request",
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
          error: "bad_request",
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
