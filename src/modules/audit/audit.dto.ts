import { z } from 'zod';

export const AuditLogQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(50).transform((v) => Number(v)),
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AuditLogQueryDto = z.infer<typeof AuditLogQuerySchema>;
