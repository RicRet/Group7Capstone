import { z } from 'zod';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Accept either a plain { lat, lon } object or a GeoJSON Point
const destinationGeomSchema = z.union([
  z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180)
  }),
  z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z.number().min(-180).max(180), // lon
      z.number().min(-90).max(90)    // lat
    ])
  })
]);

export const createReminderSchema = {
  body: z.object({
    label:             z.string().min(1).max(120),
    destination_geom:  destinationGeomSchema,
    destination_label: z.string().max(200).optional(),
    remind_time:       z.string().regex(/^\d{2}:\d{2}$/, 'remind_time must be HH:MM'),
    days_of_week:      z.array(z.enum(DAYS)).min(1, 'At least one day required'),
    active_from:       z.string().date().optional().nullable(),
    active_until:      z.string().date().optional().nullable(),
    saved_route_id:    z.string().uuid().optional().nullable()
  })
};

export const updateReminderSchema = {
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    label:             z.string().min(1).max(120).optional(),
    destination_geom:  destinationGeomSchema.optional(),
    destination_label: z.string().max(200).optional().nullable(),
    remind_time:       z.string().regex(/^\d{2}:\d{2}$/, 'remind_time must be HH:MM').optional(),
    days_of_week:      z.array(z.enum(DAYS)).min(1).optional(),
    active_from:       z.string().date().optional().nullable(),
    active_until:      z.string().date().optional().nullable(),
    saved_route_id:    z.string().uuid().optional().nullable()
  })
};

export const deleteReminderSchema = {
  params: z.object({
    id: z.string().uuid()
  })
};
