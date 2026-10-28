import { Component, DestroyRef, inject, input, output } from '@angular/core';
import { debounce } from '../../../core/utils/debounce';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from '../../../domain/donation/enum/payment-method';
import { PaymentMethod } from '../../../domain/donation/enum/payment-method';
import { DonationSort, DonationsFilter } from '../../../domain/donation/types/donation-types';

const SEARCH_DEBOUNCE_MS = 300;
const SORT_OPTIONS: ReadonlyArray<{ value: DonationSort; label: string }> = [
  { value: 'donatedAt:desc', label: 'Newest first' },
  { value: 'donatedAt:asc', label: 'Oldest first' },
  { value: 'amount:desc', label: 'Largest amount' },
  { value: 'amount:asc', label: 'Smallest amount' }
];

@Component({
  selector: 'app-donations-toolbar',
  templateUrl: './donations-toolbar.html',
  styleUrl: './donations-toolbar.scss'
})
export class DonationsToolbar {
  readonly filter = input.required<DonationsFilter>();
  readonly isFiltered = input(false);
  readonly filterChange = output<Partial<DonationsFilter>>();
  readonly clear = output();

  protected paymentMethods = PAYMENT_METHODS;
  protected labels = PAYMENT_METHOD_LABELS;
  protected sortOptions = SORT_OPTIONS;

  private readonly emitSearch = debounce((search: string) => this.filterChange.emit({ search }), SEARCH_DEBOUNCE_MS);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.emitSearch.cancel());
  }

  onSearch(event: Event) {
    this.emitSearch((event.target as HTMLInputElement).value);
  }

  onPaymentMethod(event: Event) {
    this.filterChange.emit({ paymentMethod: (event.target as HTMLSelectElement).value as PaymentMethod | '' });
  }

  onSort(event: Event) {
    this.filterChange.emit({ sort: (event.target as HTMLSelectElement).value as DonationSort });
  }
}
