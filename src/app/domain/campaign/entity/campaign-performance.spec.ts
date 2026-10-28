import { PaymentMethod } from '../../donation/enum/payment-method';
import { CampaignChannel } from '../enum/campaign-channel';
import { CampaignOverviewRecord } from '../types/campaign-types';
import { CampaignPerformance } from './campaign-performance';

/** A 30-day campaign (1–30 June) with a €100,000 goal, half of it raised. */
const overview: CampaignOverviewRecord = {
  campaign: {
    id: 'cmp_1',
    name: 'Summer streets',
    charityName: 'Ocean Trust',
    channel: CampaignChannel.Street,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    currency: 'EUR',
    goalAmount: 100_000_00,
    donorGoal: 1000
  },
  raisedAmount: 50_000_00,
  donationCount: 400,
  uniqueDonors: 380,
  monthlyDonorCount: 300,
  averageAmount: 125_00,
  daily: [],
  byPaymentMethod: [{ method: PaymentMethod.SepaDirectDebit, amount: 50_000_00, count: 400 }]
};

const on = (isoDate: string) => new CampaignPerformance(overview, new Date(`${isoDate}T12:00:00`));

describe('CampaignPerformance', () => {
  it('counts the running day as elapsed and the rest as remaining', () => {
    const performance = on('2026-06-15');

    expect(performance.phase()).toBe('active');
    expect(performance.totalDays()).toBe(30);
    expect(performance.elapsedDays()).toBe(15);
    expect(performance.remainingDays()).toBe(15);
    expect(performance.timeElapsedPercent()).toBe(50);
  });

  it('classifies pace by comparing money progress with time progress', () => {
    expect(on('2026-06-06').pace()).toBe('ahead'); // 50 % raised, 20 % of the time gone
    expect(on('2026-06-15').pace()).toBe('on_track'); // 50 % raised, 50 % of the time gone
    expect(on('2026-06-24').pace()).toBe('behind'); // 50 % raised, 80 % of the time gone
  });
});
