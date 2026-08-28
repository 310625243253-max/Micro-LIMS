import { z } from 'zod';

export const SampleTypeEnum = z.enum([
  'BLOOD',
  'URINE',
  'SPUTUM',
  'SWAB',
  'STOOL',
  'CSF',
  'TISSUE',
  'SYNOVIAL_FLUID',
  'OTHER',
]);

export const PriorityEnum = z.enum(['ROUTINE', 'URGENT', 'STAT']);

export const SampleStatusEnum = z.enum([
  'REGISTERED',
  'ACCESSIONED',
  'IN_TESTING',
  'TESTING_COMPLETE',
  'UNDER_REVIEW',
  'APPROVED',
  'FINALIZED',
  'CANCELLED',
]);

export const CreateSampleSchema = z.object({
  patientSyntheticId: z.string().min(1, 'Patient Synthetic ID is required'),
  patientSyntheticName: z.string().optional().nullable(),
  sampleType: SampleTypeEnum,
  collectionSite: z.string().min(1, 'Collection site is required'),
  priority: PriorityEnum.default('ROUTINE'),
  collectedAt: z.string().or(z.date()).transform((val) => new Date(val)),
  clinicalNotes: z.string().optional().nullable(),
});

export const UpdateSampleSchema = z.object({
  patientSyntheticId: z.string().optional(),
  patientSyntheticName: z.string().optional().nullable(),
  sampleType: SampleTypeEnum.optional(),
  collectionSite: z.string().optional(),
  priority: PriorityEnum.optional(),
  clinicalNotes: z.string().optional().nullable(),
});

export const UpdateSampleStatusSchema = z.object({
  status: SampleStatusEnum,
  reason: z.string().optional(),
});

export const SampleQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(20).transform((v) => Number(v)),
  search: z.string().optional(),
  status: SampleStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  sampleType: SampleTypeEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['created_at', 'collected_at', 'accession_number', 'priority', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc'),
});

export type CreateSampleDto = z.infer<typeof CreateSampleSchema>;
export type UpdateSampleDto = z.infer<typeof UpdateSampleSchema>;
export type UpdateSampleStatusDto = z.infer<typeof UpdateSampleStatusSchema>;
export type SampleQueryDto = z.infer<typeof SampleQuerySchema>;
