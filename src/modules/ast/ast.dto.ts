import { z } from 'zod';

export const AstMethodEnum = z.enum([
  'KIRBY_BAUER_DISC',
  'MIC_BROTH_DILUTION',
  'E_TEST',
]);

export const AstInterpretationEnum = z.enum([
  'SUSCEPTIBLE',
  'INTERMEDIATE',
  'RESISTANT',
  'NOT_INTERPRETED',
]);

export const CreateAstSchema = z.object({
  cultureId: z.string().uuid('Valid Culture UUID is required'),
  organismIdentified: z.string().min(1, 'Organism identified is required (e.g., Staphylococcus aureus)'),
  antibioticName: z.string().min(1, 'Antibiotic name with potency is required (e.g., Vancomycin, Ciprofloxacin 5µg)'),
  method: AstMethodEnum.default('KIRBY_BAUER_DISC'),
  zoneDiameterMm: z.number().min(0).max(60).optional().nullable(),
  micValueUgMl: z.number().min(0).optional().nullable(),
  interpretation: AstInterpretationEnum.default('SUSCEPTIBLE'),
  referenceGuideline: z.string().default('CLSI-M100-DEMO'),
  notes: z.string().optional().nullable(),
});

export const CreateBatchAstSchema = z.object({
  cultureId: z.string().uuid('Valid Culture UUID is required'),
  organismIdentified: z.string().min(1, 'Organism identified is required'),
  records: z.array(
    z.object({
      antibioticName: z.string().min(1),
      method: AstMethodEnum.default('KIRBY_BAUER_DISC'),
      zoneDiameterMm: z.number().min(0).max(60).optional().nullable(),
      micValueUgMl: z.number().min(0).optional().nullable(),
      interpretation: AstInterpretationEnum.default('SUSCEPTIBLE'),
      referenceGuideline: z.string().default('CLSI-M100-DEMO'),
      notes: z.string().optional().nullable(),
    })
  ).min(1, 'At least one AST antibiotic entry is required'),
});

export const AstQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(50).transform((v) => Number(v)),
  cultureId: z.string().uuid().optional(),
  organismIdentified: z.string().optional(),
  interpretation: AstInterpretationEnum.optional(),
});

export type CreateAstDto = z.infer<typeof CreateAstSchema>;
export type CreateBatchAstDto = z.infer<typeof CreateBatchAstSchema>;
export type AstQueryDto = z.infer<typeof AstQuerySchema>;
