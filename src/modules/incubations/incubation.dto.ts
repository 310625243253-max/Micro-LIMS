import { z } from 'zod';

export const AtmosphereEnum = z.enum([
  'AEROBIC',
  'ANAEROBIC',
  'MICROAEROPHILIC',
  'CO2_5_PERCENT',
]);

export const IncubationStatusEnum = z.enum([
  'SCHEDULED',
  'RUNNING',
  'DUE',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
]);

export const CreateIncubationSchema = z.object({
  cultureId: z.string().uuid('Valid Culture UUID is required'),
  incubatorId: z.string().min(1, 'Incubator unit ID is required (e.g., INCUBATOR-A1)'),
  temperatureCelsius: z.number().min(0).max(80).default(37.0),
  atmosphere: AtmosphereEnum.default('AEROBIC'),
  durationHours: z.number().int().positive('Duration must be at least 1 hour').default(24),
  operatorNotes: z.string().optional().nullable(),
});

export const UpdateIncubationStatusSchema = z.object({
  status: IncubationStatusEnum,
  operatorNotes: z.string().optional().nullable(),
});

export const IncubationQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(20).transform((v) => Number(v)),
  cultureId: z.string().uuid().optional(),
  status: IncubationStatusEnum.optional(),
  incubatorId: z.string().optional(),
  atmosphere: AtmosphereEnum.optional(),
  search: z.string().optional(),
});

export type CreateIncubationDto = z.infer<typeof CreateIncubationSchema>;
export type UpdateIncubationStatusDto = z.infer<typeof UpdateIncubationStatusSchema>;
export type IncubationQueryDto = z.infer<typeof IncubationQuerySchema>;
