import { z } from 'zod';

export const ContaminationCategoryEnum = z.enum([
  'MEDIA_CONTAMINATION',
  'CROSS_CONTAMINATION',
  'ENVIRONMENTAL',
  'TECHNIQUE_ERROR',
  'EQUIPMENT_FAILURE',
]);

export const ContaminationStatusEnum = z.enum([
  'SUSPECTED',
  'QUARANTINED',
  'INVESTIGATED',
  'RESOLVED',
]);

export const CreateContaminationSchema = z.object({
  sampleId: z.string().uuid().optional().nullable(),
  cultureId: z.string().uuid().optional().nullable(),
  category: ContaminationCategoryEnum,
  description: z.string().min(1, 'Description of contamination event is required'),
  suspectedCause: z.string().optional().nullable(),
  correctiveAction: z.string().optional().nullable(),
  status: ContaminationStatusEnum.default('SUSPECTED'),
});

export const UpdateContaminationSchema = z.object({
  status: ContaminationStatusEnum.optional(),
  suspectedCause: z.string().optional().nullable(),
  correctiveAction: z.string().optional().nullable(),
});

export const ContaminationQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(20).transform((v) => Number(v)),
  status: ContaminationStatusEnum.optional(),
  category: ContaminationCategoryEnum.optional(),
  sampleId: z.string().uuid().optional(),
  cultureId: z.string().uuid().optional(),
});

export type CreateContaminationDto = z.infer<typeof CreateContaminationSchema>;
export type UpdateContaminationDto = z.infer<typeof UpdateContaminationSchema>;
export type ContaminationQueryDto = z.infer<typeof ContaminationQuerySchema>;
