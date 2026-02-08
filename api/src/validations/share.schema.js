import { z } from 'zod';

const latLonSchema = {
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
};

export const shareCreateSchema = {
  body: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    label: z
      .string()
      .trim()
      .max(80, 'Label too long')
      .optional(),
    expiresInSec: z
      .coerce
      .number()
      .int()
      .min(60, 'Minimum 60 seconds')
      .max(3600, 'Maximum 3600 seconds')
      .optional(),
  }),
};

export const shareParamsSchema = {
  params: z.object({ shareId: z.string().min(6).max(120) }),
};

export const shareQuerySchema = {
  query: z.object({ includeOwner: z.coerce.boolean().optional() }),
};