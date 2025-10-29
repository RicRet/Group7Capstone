import { z } from 'zod';
export const bboxQuery = {
  query: z.object({
    minLon: z.coerce.number(),
    minLat: z.coerce.number(),
    maxLon: z.coerce.number(),
    maxLat: z.coerce.number()
  })
};
