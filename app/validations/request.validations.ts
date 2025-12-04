import z from 'zod';

namespace Request {
  export const CancelParams = z.object({
    id: z.string(),
  });

  export const DayQuery = z.object({
    restaurantId: z.string(),
    sectorId: z.string(),
    date: z.string().regex(
      // YYYY-MM-DD
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
      'Invalid date format. Expected YYYY-MM-DD'
    ),
  });

  export const DiscoverQuery = z.object({
    restaurantId: z.string(),
    sectorId: z.string(),
    date: z.string().regex(
      // YYYY-MM-DD
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
      'Invalid date format. Expected YYYY-MM-DD'
    ),
    partySize: z.coerce.number().min(1),
    duration: z.coerce
      .number()
      .int()
      .min(15)
      .max(180)
      // multiple of 15
      .refine((n) => n % 15 === 0, {
        message: 'Duration must be a multiple of 15',
      }),
    windowStart: z
      .string()
      .regex(
        // HH:MM format
        /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        'Invalid time format. Expected HH:MM'
      )
      .optional(),
    windowEnd: z
      .string()
      .regex(
        // HH:MM format
        /^(?:[01]\d|2[0-3]):[0-5]\d$/,
        'Invalid time format. Expected HH:MM'
      )
      .optional(),
    limit: z.number().optional(),
  });
}

export default Request;
