import { addDays, fromIsoDate, toIsoDate } from '../../core/dates';
import { CampaignOverviewRecord, CampaignRecord, DailyPoint } from '../../domain/campaign/types/campaign-types';
import { PAYMENT_METHODS } from '../../domain/donation/enum/payment-method';
import { DonationFrequency } from '../../domain/donation/enum/donation-frequency';
import {
  DonationRecord,
  DonationsFilter,
  DonationSort,
  DonationsQuery,
  FundraiserRecord,
  NewDonation
} from '../../domain/donation/types/donation-types';
import { Page } from '../../domain/shared/page';
import { SeedData } from './seed-data';

export class UnknownCursorError extends Error {
  constructor(cursor: string) {
    super(`Unknown cursor "${cursor}"`);
    this.name = 'UnknownCursorError';
  }
}

/**
 * Stand-in for the database behind the REST API. Lists are served with keyset
 * pagination (the cursor is the id of the last row delivered), so rows added
 * while a client is paging neither shift nor repeat the pages that follow.
 */
export class InMemoryDb {
  private readonly campaigns: CampaignRecord[];
  private readonly fundraisers: FundraiserRecord[];
  private readonly donationsByCampaign = new Map<string, DonationRecord[]>();
  private sequence: number;

  constructor(seed: SeedData) {
    this.campaigns = seed.campaigns;
    this.fundraisers = seed.fundraisers;
    for (const donation of seed.donations) {
      this.bucket(donation.campaignId).push(donation);
    }
    this.sequence = seed.donations.length;
  }

  listCampaigns(): CampaignRecord[] {
    return this.campaigns;
  }

  getCampaign(campaignId: string): CampaignRecord | undefined {
    return this.campaigns.find((campaign) => campaign.id === campaignId);
  }

  listFundraisers(): FundraiserRecord[] {
    return this.fundraisers;
  }

  getFundraiser(fundraiserId: string): FundraiserRecord | undefined {
    return this.fundraisers.find((fundraiser) => fundraiser.id === fundraiserId);
  }

  listDonations(campaignId: string, query: DonationsQuery): Page<DonationRecord> {
    const matching = this.sorted(campaignId, query.sort).filter((donation) => matchesFilter(donation, query));
    let start = 0;
    if (query.cursor !== null) {
      const cursorIndex = matching.findIndex((donation) => donation.id === query.cursor);
      if (cursorIndex === -1) {
        throw new UnknownCursorError(query.cursor);
      }
      start = cursorIndex + 1;
    }
    const items = matching.slice(start, start + query.limit);
    const hasMore = start + query.limit < matching.length;
    return {
      items,
      total: matching.length,
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  findDonationByEmail(campaignId: string, email: string): DonationRecord | undefined {
    const wanted = email.trim().toLowerCase();
    return this.bucket(campaignId).find((donation) => donation.donor.email.toLowerCase() === wanted);
  }

  addDonation(campaignId: string, input: NewDonation): DonationRecord {
    this.sequence += 1;
    const donation: DonationRecord = {
      id: `don_${this.sequence.toString(36).padStart(5, '0')}`,
      campaignId,
      fundraiserId: input.fundraiserId,
      donor: { ...input.donor },
      amount: input.amount,
      currency: input.currency,
      frequency: input.frequency,
      paymentMethod: input.paymentMethod,
      donatedAt: input.donatedAt
    };
    this.bucket(campaignId).push(donation);
    return donation;
  }

  getOverview(campaignId: string): CampaignOverviewRecord | undefined {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) {
      return undefined;
    }
    const donations = this.bucket(campaignId);
    const byDay = new Map<string, DailyPoint>();
    const byMethod = new Map(PAYMENT_METHODS.map((method) => [method, { method, amount: 0, count: 0 }]));
    const donors = new Set<string>();
    let raisedAmount = 0;
    let monthlyDonorCount = 0;

    for (const donation of donations) {
      raisedAmount += donation.amount;
      donors.add(donation.donor.email.toLowerCase());
      if (donation.frequency === DonationFrequency.Monthly) {
        monthlyDonorCount += 1;
      }
      const day = toIsoDate(new Date(donation.donatedAt));
      const point = byDay.get(day) ?? { date: day, amount: 0, count: 0 };
      point.amount += donation.amount;
      point.count += 1;
      byDay.set(day, point);
      const share = byMethod.get(donation.paymentMethod)!;
      share.amount += donation.amount;
      share.count += 1;
    }

    return {
      campaign,
      raisedAmount,
      donationCount: donations.length,
      uniqueDonors: donors.size,
      monthlyDonorCount,
      averageAmount: donations.length === 0 ? 0 : Math.round(raisedAmount / donations.length),
      daily: everyDay(campaign.startDate, campaign.endDate).map(
        (date) => byDay.get(date) ?? { date, amount: 0, count: 0 }
      ),
      byPaymentMethod: [...byMethod.values()]
    };
  }

  private bucket(campaignId: string): DonationRecord[] {
    let bucket = this.donationsByCampaign.get(campaignId);
    if (!bucket) {
      bucket = [];
      this.donationsByCampaign.set(campaignId, bucket);
    }
    return bucket;
  }

  /** Sorting ~15k rows takes a few milliseconds, which is fine for a mock; a real database would use an index. */
  private sorted(campaignId: string, sort: DonationSort): DonationRecord[] {
    return [...this.bucket(campaignId)].sort(comparatorFor(sort));
  }
}

/** Orders by the requested field, then by id so equal values still have a stable, cursor-safe order. */
function comparatorFor(sort: DonationSort): (a: DonationRecord, b: DonationRecord) => number {
  const [field, direction] = sort.split(':') as ['donatedAt' | 'amount', 'asc' | 'desc'];
  const sign = direction === 'asc' ? 1 : -1;
  return (a, b) => {
    const byField = field === 'amount' ? a.amount - b.amount : a.donatedAt.localeCompare(b.donatedAt);
    return byField !== 0 ? byField * sign : a.id.localeCompare(b.id) * sign;
  };
}

/** Calendar days from start to end inclusive. */
function everyDay(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = fromIsoDate(startDate);
  const end = fromIsoDate(endDate).getTime();
  for (let offset = 0; ; offset += 1) {
    const day = addDays(start, offset);
    if (day.getTime() > end) {
      return days;
    }
    days.push(toIsoDate(day));
  }
}

function matchesFilter(donation: DonationRecord, filter: DonationsFilter): boolean {
  if (filter.paymentMethod && donation.paymentMethod !== filter.paymentMethod) {
    return false;
  }
  const search = filter.search.trim().toLowerCase();
  if (search === '') {
    return true;
  }
  const { firstName, lastName, email } = donation.donor;
  return `${firstName} ${lastName} ${email}`.toLowerCase().includes(search);
}
