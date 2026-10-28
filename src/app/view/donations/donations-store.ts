import { computed, inject, linkedSignal, Service, signal } from '@angular/core';
import { errorMessage } from '../../core/app-error';
import { LoadStatus } from '../../core/load-status';
import { DonationApi } from '../../api/donation-api';
import { DEFAULT_DONATIONS_FILTER, DonationRecord, DonationsFilter } from '../../domain/donation/types/donation-types';

export const DONATIONS_PAGE_SIZE = 50;
const PREFETCH_THRESHOLD = 15;

@Service({ autoProvided: false })
export class DonationsStore {
  private readonly donationApi = inject(DonationApi);
  private requestId = 0;

  readonly campaignId = signal<string | null>(null);
  readonly filter = linkedSignal<DonationsFilter>(() => {
    this.campaignId();
    return DEFAULT_DONATIONS_FILTER;
  });

  readonly items = signal<DonationRecord[]>([]);
  readonly total = signal<number | null>(null);
  readonly nextCursor = signal<string | null>(null);
  readonly status = signal<LoadStatus>('idle');
  readonly loadMoreStatus = signal<LoadStatus>('idle');
  readonly error = signal<string | null>(null);

  readonly hasMore = computed(() => this.nextCursor() !== null);
  readonly isFiltered = computed(() => {
    const { search, paymentMethod } = this.filter();
    return search.trim() !== '' || paymentMethod !== '';
  });

  setCampaign(campaignId: string): Promise<void> {
    if (campaignId === this.campaignId()) {
      return Promise.resolve();
    }
    this.campaignId.set(campaignId);
    return this.reload();
  }

  setFilter(patch: Partial<DonationsFilter>): Promise<void> {
    this.filter.update((current) => ({ ...current, ...patch }));
    return this.reload();
  }

  clearFilter(): Promise<void> {
    this.filter.set(DEFAULT_DONATIONS_FILTER);
    return this.reload();
  }

  async reload(): Promise<void> {
    const campaignId = this.campaignId();
    if (campaignId === null) {
      return;
    }
    const requestId = ++this.requestId;
    this.status.set('loading');
    this.loadMoreStatus.set('idle');
    this.error.set(null);
    this.items.set([]);
    this.total.set(null);
    this.nextCursor.set(null);

    try {
      const donations = await this.donationApi.listDonations(campaignId, {
        ...this.filter(),
        cursor: null,
        limit: DONATIONS_PAGE_SIZE
      });
      if (requestId !== this.requestId) {
        return;
      }
      this.items.set(donations.items);
      this.total.set(donations.total);
      this.nextCursor.set(donations.nextCursor);
      this.status.set('resolved');
    } catch (error) {
      if (requestId !== this.requestId) {
        return;
      }
      this.status.set('error');
      this.error.set(errorMessage(error));
    }
  }

  async loadMore(): Promise<void> {
    const campaignId = this.campaignId();
    const cursor = this.nextCursor();
    if (campaignId === null || cursor === null || this.status() !== 'resolved' || this.loadMoreStatus() === 'loading') {
      return;
    }
    const requestId = this.requestId;
    this.loadMoreStatus.set('loading');
    this.error.set(null);

    try {
      const page = await this.donationApi.listDonations(campaignId, {
        ...this.filter(),
        cursor,
        limit: DONATIONS_PAGE_SIZE
      });
      if (requestId !== this.requestId) {
        return;
      }
      this.items.update((items) => [...items, ...page.items]);
      this.total.set(page.total);
      this.nextCursor.set(page.nextCursor);
      this.loadMoreStatus.set('resolved');
    } catch (error) {
      if (requestId !== this.requestId) {
        return;
      }
      this.loadMoreStatus.set('error');
      this.error.set(errorMessage(error));
    }
  }

  onScrolledIndex(index: number) {
    if (this.loadMoreStatus() === 'error') {
      return;
    }
    if (index >= this.items().length - PREFETCH_THRESHOLD) {
      this.loadMore();
    }
  }
}
