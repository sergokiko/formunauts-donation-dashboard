import { z } from 'zod';
import { CampaignChannel } from '../../domain/campaign/enum/campaign-channel';
import {
  CampaignOverviewRecord,
  CampaignRecord,
  DailyPoint,
  PaymentMethodShare
} from '../../domain/campaign/types/campaign-types';
import { PaymentMethod } from '../../domain/donation/enum/payment-method';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  charityName: z.string(),
  channel: z.enum(CampaignChannel),
  startDate: isoDate,
  endDate: isoDate,
  currency: z.literal('EUR'),
  goalAmount: z.number().int().nonnegative(),
  donorGoal: z.number().int().nonnegative()
}) satisfies z.ZodType<CampaignRecord>;

export const CampaignListSchema = z.array(CampaignSchema);

const DailyPointSchema = z.object({
  date: isoDate,
  amount: z.number().int(),
  count: z.number().int()
}) satisfies z.ZodType<DailyPoint>;

const PaymentMethodShareSchema = z.object({
  method: z.enum(PaymentMethod),
  amount: z.number().int(),
  count: z.number().int()
}) satisfies z.ZodType<PaymentMethodShare>;

export const CampaignOverviewSchema = z.object({
  campaign: CampaignSchema,
  raisedAmount: z.number().int(),
  donationCount: z.number().int(),
  uniqueDonors: z.number().int(),
  monthlyDonorCount: z.number().int(),
  averageAmount: z.number().int(),
  daily: z.array(DailyPointSchema),
  byPaymentMethod: z.array(PaymentMethodShareSchema)
}) satisfies z.ZodType<CampaignOverviewRecord>;
