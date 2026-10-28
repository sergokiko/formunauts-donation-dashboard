import { z } from 'zod';
import { DonationSchema } from './donation-schemas';

/** Error envelope every failing endpoint returns. */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional()
});

export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;

export const DuplicateDonorErrorSchema = ApiErrorSchema.extend({
  code: z.literal('DUPLICATE_DONOR'),
  existing: DonationSchema
});
