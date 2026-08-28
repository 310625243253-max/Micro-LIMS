import { z } from 'zod';

export const MediaLotStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'QUARANTINED', 'DEPLETED']);

export const CreateMediaLotSchema = z.object({
  lotNumber: z.string().min(1, 'Lot number is required'),
  mediaName: z.string().min(1, 'Media name is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  receivedDate: z.string().optional(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  status: MediaLotStatusEnum.default('ACTIVE'),
  storageConditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const MediaLotQuerySchema = z.object({
  page: z.string().or(z.number()).default(1).transform((v) => Number(v)),
  limit: z.string().or(z.number()).default(50).transform((v) => Number(v)),
  status: MediaLotStatusEnum.optional(),
  search: z.string().optional(),
});

export type CreateMediaLotDto = z.infer<typeof CreateMediaLotSchema>;
export type MediaLotQueryDto = z.infer<typeof MediaLotQuerySchema>;
