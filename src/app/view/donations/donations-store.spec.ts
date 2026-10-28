import { TestBed } from '@angular/core/testing';
import { DonationApi } from '../../api/donation-api';
import { DonationFrequency } from '../../domain/donation/enum/donation-frequency';
import { PaymentMethod } from '../../domain/donation/enum/payment-method';
import { DonationRecord, DonationsQuery } from '../../domain/donation/types/donation-types';
import { Page } from '../../domain/shared/page';
import { DONATIONS_PAGE_SIZE, DonationsStore } from './donations-store';

function donation(index: number): DonationRecord {
  return {
    id: `don_${index}`,
    campaignId: 'cmp_1',
    fundraiserId: 'fr_1',
    donor: { firstName: 'Donor', lastName: `Number ${index}`, email: `donor${index}@example.org` },
    amount: 1000 + index,
    currency: 'EUR',
    frequency: DonationFrequency.Monthly,
    paymentMethod: PaymentMethod.SepaDirectDebit,
    donatedAt: new Date(Date.UTC(2026, 5, 1, 12, index)).toISOString()
  };
}

/**
 * Serves `count` donations newest-first in cursor pages and records every query.
 * Responses stay pending until `respond()` releases them, so a test can control their order.
 */
class FakeDonationApi implements Pick<DonationApi, 'listDonations'> {
  readonly queries: DonationsQuery[] = [];
  private pending: Array<() => void> = [];

  constructor(private readonly count: number) {}

  listDonations(_campaignId: string, query: DonationsQuery): Promise<Page<DonationRecord>> {
    this.queries.push(query);
    const matching = Array.from({ length: this.count }, (_, i) => donation(this.count - i)).filter((d) =>
      d.donor.lastName.toLowerCase().includes(query.search.toLowerCase())
    );
    const start = query.cursor === null ? 0 : matching.findIndex((d) => d.id === query.cursor) + 1;
    const items = matching.slice(start, start + query.limit);
    const page: Page<DonationRecord> = {
      items,
      total: matching.length,
      nextCursor: start + query.limit < matching.length ? items[items.length - 1].id : null
    };
    return new Promise((resolve) => this.pending.push(() => resolve(page)));
  }

  /** Releases the pending responses in the given order (default: the order the requests were made). */
  respond(order: number[] = this.pending.map((_, i) => i)): void {
    const release = order.map((i) => this.pending[i]);
    this.pending = this.pending.filter((_, i) => !order.includes(i));
    release.forEach((fn) => fn());
  }
}

describe('DonationsStore', () => {
  let api: FakeDonationApi;
  let store: DonationsStore;

  beforeEach(() => {
    api = new FakeDonationApi(120);
    TestBed.configureTestingModule({
      providers: [DonationsStore, { provide: DonationApi, useValue: api }]
    });
    store = TestBed.inject(DonationsStore);
  });

  it('pages through a campaign with the cursor and stops at the end', async () => {
    const first = store.setCampaign('cmp_1');
    api.respond();
    await first;

    expect(store.items()).toHaveLength(DONATIONS_PAGE_SIZE);
    expect(store.items()[0].id).toBe('don_120');
    expect(store.total()).toBe(120);
    expect(store.hasMore()).toBe(true);

    const second = store.loadMore();
    api.respond();
    await second;
    const third = store.loadMore();
    api.respond();
    await third;

    expect(api.queries.map((q) => q.cursor)).toEqual([null, 'don_71', 'don_21']);
    expect(store.items()).toHaveLength(120);
    expect(store.hasMore()).toBe(false);

    await store.loadMore();
    expect(api.queries).toHaveLength(3);
  });

  it('ignores the response of a request that was superseded by a newer one', async () => {
    const stale = store.setCampaign('cmp_1');
    const fresh = store.setFilter({ search: 'Number 7' });

    api.respond([1, 0]); // the newer request answers first, the older one last
    await Promise.all([stale, fresh]);

    expect(store.status()).toBe('resolved');
    expect(store.items().every((d) => d.donor.lastName.includes('Number 7'))).toBe(true);
    expect(store.total()).toBeLessThan(120);
  });
});
