import { PaymentMethod } from '../../donation/enum/payment-method';
import { CurrencyCode } from '../../shared/money';
import { CampaignChannel } from '../enum/campaign-channel';

/** A face-to-face fundraising drive run for a charity. Amounts are minor units. */
export interface CampaignRecord {
  id: string;
  name: string;
  charityName: string;
  channel: CampaignChannel;
  /** Calendar day, `YYYY-MM-DD`. */
  startDate: string;
  /** Calendar day, `YYYY-MM-DD`, inclusive. */
  endDate: string;
  currency: CurrencyCode;
  goalAmount: number;
  donorGoal: number;
}

export interface DailyPoint {
  /** Calendar day, `YYYY-MM-DD`. */
  date: string;
  amount: number;
  count: number;
}

export interface PaymentMethodShare {
  method: PaymentMethod;
  amount: number;
  count: number;
}

export interface CampaignOverviewRecord {
  campaign: CampaignRecord;
  raisedAmount: number;
  donationCount: number;
  uniqueDonors: number;
  monthlyDonorCount: number;
  averageAmount: number;
  daily: DailyPoint[];
  byPaymentMethod: PaymentMethodShare[];
}
