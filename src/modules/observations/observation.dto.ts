import { z } from 'zod';

export const GrowthStatusEnum = z.enum([
  'NO_GROWTH',
  'SCANT_GROWTH',
  'MODERATE_GROWTH',
  'HEAVY_GROWTH',
]);

export const HemolysisEnum = z.enum(['ALPHA', 'BETA', 'GAMMA', 'NONE']);

export const CreateObservationSchema = z.object({
  cultureId: z.string().uuid('Valid Culture UUID is required'),
  growthDetected: z.boolean().default(false),
  growthStatus: GrowthStatusEnum.default('NO_GROWTH'),
  colonyMorphology: z.string().optional().nullable(),
  pigmentation: z.string().optional().nullable(),
  hemolysis: HemolysisEnum.default('NONE'),
  colonyCountCfu: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ObservationQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(20).transform((v) => Number(v)),
  cultureId: z.string().uuid().optional(),
  growthDetected: z.string().or(z.boolean()).optional().transform((v) => v === undefined ? undefined : String(v) === 'true'),
});

export type CreateObservationDto = z.infer<typeof CreateObservationSchema>;
export type ObservationQueryDto = z.infer<typeof ObservationQuerySchema>;
