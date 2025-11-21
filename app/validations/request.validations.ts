import z from "zod";

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
      "Invalid date format. Expected YYYY-MM-DD",
    ),
  });
}

export default Request;
