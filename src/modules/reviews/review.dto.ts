import { z } from 'zod';

export const ReviewStageEnum = z.enum([
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'FINALIZED',
]);

export const ReviewDecisionEnum = z.enum(['APPROVE', 'REJECT', 'AMEND']);

export const SubmitReviewSchema = z.object({
  sampleId: z.string().uuid('Valid Sample UUID is required'),
  comments: z.string().optional().nullable(),
});

export const PerformReviewSchema = z.object({
  sampleId: z.string().uuid('Valid Sample UUID is required'),
  decision: ReviewDecisionEnum,
  comments: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  amendmentReason: z.string().optional().nullable(),
  signerName: z.string().min(1, 'Signer legal full name is required for electronic verification'),
  signerTitle: z.string().min(1, 'Signer professional title is required (e.g., QA Director, Senior Pathologist)'),
}).refine(
  (data) => {
    if (data.decision === 'REJECT' && (!data.rejectionReason || data.rejectionReason.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Rejection reason is mandatory when decision is REJECT',
    path: ['rejectionReason'],
  }
).refine(
  (data) => {
    if (data.decision === 'AMEND' && (!data.amendmentReason || data.amendmentReason.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Amendment reason is mandatory when decision is AMEND',
    path: ['amendmentReason'],
  }
);

export const ReviewQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(20).transform((v) => Number(v)),
  sampleId: z.string().uuid().optional(),
  stage: ReviewStageEnum.optional(),
  decision: ReviewDecisionEnum.optional(),
});

export type SubmitReviewDto = z.infer<typeof SubmitReviewSchema>;
export type PerformReviewDto = z.infer<typeof PerformReviewSchema>;
export type ReviewQueryDto = z.infer<typeof ReviewQuerySchema>;
