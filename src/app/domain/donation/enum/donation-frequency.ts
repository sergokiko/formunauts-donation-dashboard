export enum DonationFrequency {
  OneTime = 'one_time',
  Monthly = 'monthly'
}

export const DONATION_FREQUENCY_LABELS: Record<DonationFrequency, string> = {
  [DonationFrequency.OneTime]: 'One-time',
  [DonationFrequency.Monthly]: 'Monthly'
};
