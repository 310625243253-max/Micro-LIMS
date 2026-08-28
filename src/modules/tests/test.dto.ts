import { z } from 'zod';

export const CreateTestSchema = z.object({
  cultureId: z.string().uuid('Valid Culture UUID is required'),
  testName: z.string().min(1, 'Test name is required (e.g., Catalase, Gram Stain, Coagulase)'),
  method: z.string().min(1, 'Method is required (e.g., Slide Method, Microscopy)'),
  rawResult: z.string().min(1, 'Raw result is required (e.g., Positive, 1000x Oil Immersion)'),
  interpretation: z.string().min(1, 'Diagnostic interpretation is required'),
  notes: z.string().optional().nullable(),
});

export const UpdateTestSchema = z.object({
  rawResult: z.string().optional(),
  interpretation: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
});

export const TestQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(50).transform((v) => Number(v)),
  cultureId: z.string().uuid().optional(),
  testName: z.string().optional(),
  status: z.string().optional(),
});

export type CreateTestDto = z.infer<typeof CreateTestSchema>;
export type UpdateTestDto = z.infer<typeof UpdateTestSchema>;
export type TestQueryDto = z.infer<typeof TestQuerySchema>;
