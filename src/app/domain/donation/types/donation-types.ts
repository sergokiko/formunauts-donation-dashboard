import { CurrencyCode } from '../../shared/money';
import { DonationFrequency } from '../enum/donation-frequency';
import { PaymentMethod } from '../enum/payment-method';

export interface Donor {
  firstName: string;
  lastName: string;
  email: string;
}

/** One donor sign-up collected by a fundraiser. Amounts are minor units. */
export interface DonationRecord {
  id: string;
  campaignId: string;
  fundraiserId: string;
  donor: Donor;
  amount: number;
  currency: CurrencyCode;
  frequency: DonationFrequency;
  paymentMethod: PaymentMethod;
  /** ISO 8601 timestamp. */
  donatedAt: string;
}

export interface FundraiserRecord {
  id: string;
  firstName: string;
  lastName: string;
}

export type DonationSort = 'donatedAt:desc' | 'donatedAt:asc' | 'amount:desc' | 'amount:asc';

export interface DonationsFilter {
  search: string;
  /** Empty string = all methods. */
  paymentMethod: PaymentMethod | '';
  sort: DonationSort;
}

export const DEFAULT_DONATIONS_FILTER: DonationsFilter = {
  search: '',
  paymentMethod: '',
  sort: 'donatedAt:desc'
};

export interface DonationsQuery extends DonationsFilter {
  cursor: string | null;
  limit: number;
}

export interface NewDonation {
  donor: Donor;
  amount: number;
  currency: CurrencyCode;
  frequency: DonationFrequency;
  paymentMethod: PaymentMethod;
  fundraiserId: string;
  donatedAt: string;
}

export type AddDonationResult =
  { status: 'created'; donation: DonationRecord } | { status: 'duplicate_donor'; existing: DonationRecord };
