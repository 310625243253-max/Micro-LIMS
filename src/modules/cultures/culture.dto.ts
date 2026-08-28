import { z } from 'zod';

export const InoculationMethodEnum = z.enum([
  'STREAK_4_QUADRANT',
  'POUR_PLATE',
  'LAWN_CULTURE',
  'BROTH_INOCULATION',
]);

export const CultureStatusEnum = z.enum([
  'INOCULATED',
  'INCUBATING',
  'OBSERVED',
  'DISCARDED',
  'CONTAMINATED',
]);

export const CreateCultureSchema = z.object({
  sampleId: z.string().uuid('Valid Sample UUID is required'),
  mediaLotId: z.string().uuid().optional().nullable(),
  mediaType: z.string().min(1, 'Media type description is required'),
  inoculationMethod: InoculationMethodEnum.default('STREAK_4_QUADRANT'),
  notes: z.string().optional().nullable(),
});

export const UpdateCultureStatusSchema = z.object({
  status: CultureStatusEnum,
  notes: z.string().optional().nullable(),
});

export const CultureQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(20).transform((v) => Number(v)),
  sampleId: z.string().uuid().optional(),
  status: CultureStatusEnum.optional(),
  mediaLotId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type CreateCultureDto = z.infer<typeof CreateCultureSchema>;
export type UpdateCultureStatusDto = z.infer<typeof UpdateCultureStatusSchema>;
export type CultureQueryDto = z.infer<typeof CultureQuerySchema>;
