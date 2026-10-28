import { Component, input } from '@angular/core';
import { DONATION_FREQUENCY_LABELS, DonationFrequency } from '../../../domain/donation/enum/donation-frequency';
import { PAYMENT_METHOD_LABELS } from '../../../domain/donation/enum/payment-method';
import { DonationRecord } from '../../../domain/donation/types/donation-types';
import { LocalDatePipe } from '../../common/local-date-pipe';
import { MoneyPipe } from '../../common/money-pipe';

@Component({
  selector: 'app-donation-row',
  imports: [MoneyPipe, LocalDatePipe],
  templateUrl: './donation-row.html',
  styleUrl: './donation-row.scss'
})
export class DonationRow {
  readonly donation = input.required<DonationRecord>();
  readonly fundraiserName = input.required<string>();

  protected monthly = DonationFrequency.Monthly;
  protected frequencyLabels = DONATION_FREQUENCY_LABELS;
  protected methodLabels = PAYMENT_METHOD_LABELS;
}
