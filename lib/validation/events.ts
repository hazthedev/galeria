import { z } from 'zod';

export const eventTypeSchema = z.enum(['birthday', 'wedding', 'corporate', 'other']);
export const eventStatusSchema = z.enum(['draft', 'active', 'ended', 'archived']);

export const eventCreateSchema = z.object({
  name: z.string().min(1),
  event_date: z.coerce.date(),
  event_type: eventTypeSchema,
  description: z.string().optional(),
  location: z.string().optional(),
  expected_guests: z.coerce.number().int().positive().optional(),
  custom_hashtag: z.string().optional(),
  settings: z.any().optional(),
});

export const eventUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  event_date: z.coerce.date().optional(),
  event_type: eventTypeSchema.optional(),
  location: z.string().optional(),
  settings: z.any().optional(),
  status: eventStatusSchema.optional(),
  short_code: z.string().optional(),
  slug: z.string().optional(),
  qr_code_url: z.string().optional(),
});

export const eventBulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  updates: eventUpdateSchema,
});

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type EventBulkUpdateInput = z.infer<typeof eventBulkUpdateSchema>;
