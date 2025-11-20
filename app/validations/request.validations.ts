import z from "zod";

namespace Request {
  export const CancelParams = z.object({
    id: z.string(),
  });
}

export default Request;
