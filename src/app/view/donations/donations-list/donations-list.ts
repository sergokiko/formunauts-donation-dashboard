import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Component, computed, inject, input } from '@angular/core';
import { DonationRecord, FundraiserRecord } from '../../../domain/donation/types/donation-types';
import { ErrorState } from '../../common/error-state/error-state';
import { formatInteger } from '../../common/format';
import { Skeleton } from '../../common/skeleton/skeleton';
import { ViewportService } from '../../common/viewport-service';
import { DonationRow } from '../donation-row/donation-row';
import { DonationsStore } from '../donations-store';
import { DonationsToolbar } from '../donations-toolbar/donations-toolbar';

const ROW_HEIGHT_DESKTOP = 56;
const ROW_HEIGHT_MOBILE = 112;

@Component({
  selector: 'app-donations-list',
  imports: [
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
    DonationsToolbar,
    DonationRow,
    ErrorState,
    Skeleton
  ],
  templateUrl: './donations-list.html',
  styleUrl: './donations-list.scss'
})
export class DonationsList {
  readonly fundraisers = input<FundraiserRecord[]>([]);

  protected readonly store = inject(DonationsStore);
  private readonly viewport = inject(ViewportService);

  protected readonly rowHeight = computed(() => (this.viewport.isMobile() ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP));
  protected placeholders = [0, 1, 2, 3, 4, 5, 6, 7];

  private readonly fundraiserNames = computed(
    () =>
      new Map(this.fundraisers().map((fundraiser) => [fundraiser.id, `${fundraiser.firstName} ${fundraiser.lastName}`]))
  );

  protected readonly countLabel = computed(() => {
    const total = this.store.total();
    if (this.store.status() !== 'resolved' || total === null) {
      return '';
    }
    const noun = total === 1 ? 'donation' : 'donations';
    return this.store.isFiltered() ? `${formatInteger(total)} matching ${noun}` : `${formatInteger(total)} ${noun}`;
  });

  protected readonly totalLabel = computed(() => {
    const total = this.store.total();
    return total === null ? '' : `All ${formatInteger(total)} donations loaded`;
  });

  fundraiserName(id: string): string {
    return this.fundraiserNames().get(id) ?? 'Unknown fundraiser';
  }

  trackById(_index: number, donation: DonationRecord): string {
    return donation.id;
  }
}
