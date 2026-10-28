import { z } from 'zod';
import { DonationFrequency } from '../../domain/donation/enum/donation-frequency';
import { PaymentMethod } from '../../domain/donation/enum/payment-method';
import { DonationRecord, FundraiserRecord, NewDonation } from '../../domain/donation/types/donation-types';
import { Page } from '../../domain/shared/page';

const DonorSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string()
});

export const DonationSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  fundraiserId: z.string(),
  donor: DonorSchema,
  amount: z.number().int(),
  currency: z.literal('EUR'),
  frequency: z.enum(DonationFrequency),
  paymentMethod: z.enum(PaymentMethod),
  donatedAt: z.iso.datetime()
}) satisfies z.ZodType<DonationRecord>;

export const DonationPageSchema = z.object({
  items: z.array(DonationSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int()
}) satisfies z.ZodType<Page<DonationRecord>>;

export const FundraiserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string()
}) satisfies z.ZodType<FundraiserRecord>;

export const FundraiserListSchema = z.array(FundraiserSchema);

/** Server-side validation of a submission (also used by the mock backend). */
export const NewDonationSchema = z.object({
  donor: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.email().max(120)
  }),
  amount: z.number().int().min(100).max(1_000_000),
  currency: z.literal('EUR'),
  frequency: z.enum(DonationFrequency),
  paymentMethod: z.enum(PaymentMethod),
  fundraiserId: z.string().min(1),
  donatedAt: z.iso.datetime()
}) satisfies z.ZodType<NewDonation>;
