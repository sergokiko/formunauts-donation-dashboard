import { afterNextRender, Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import {
  email,
  FieldTree,
  form,
  FormField,
  max,
  maxLength,
  min,
  required,
  submit,
  validate
} from '@angular/forms/signals';
import { errorMessage } from '../../../core/app-error';
import { atTime, fromIsoDate, toIsoDate } from '../../../core/dates';
import { CampaignRecord } from '../../../domain/campaign/types/campaign-types';
import { DONATION_FREQUENCY_LABELS, DonationFrequency } from '../../../domain/donation/enum/donation-frequency';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, PaymentMethod } from '../../../domain/donation/enum/payment-method';
import { DonationApi } from '../../../api/donation-api';
import { DonationRecord, FundraiserRecord, NewDonation } from '../../../domain/donation/types/donation-types';
import { CurrencyCode, toMinorUnits } from '../../../domain/shared/money';
import { LocalDatePipe } from '../../common/local-date-pipe';

export interface DonationFormModel {
  donor: { firstName: string; lastName: string; email: string };
  /** Major units as typed; `null` while empty. Converted to minor units on submit. */
  amount: number | null;
  frequency: DonationFrequency;
  paymentMethod: PaymentMethod | '';
  fundraiserId: string;
  /** `YYYY-MM-DD` */
  donatedAt: string;
}

export const MIN_DONATION_EUR = 1;
export const MAX_DONATION_EUR = 10_000;

/** Latest day a donation can be dated: today, or the campaign's last day if it already ended. */
export function latestAllowedDate(campaign: CampaignRecord, today: string): string {
  return today < campaign.endDate ? today : campaign.endDate;
}

export function emptyModel(campaign: CampaignRecord, today: string): DonationFormModel {
  return {
    donor: { firstName: '', lastName: '', email: '' },
    amount: null,
    frequency: DonationFrequency.Monthly,
    paymentMethod: '',
    fundraiserId: '',
    donatedAt: latestAllowedDate(campaign, today)
  };
}

export function dateWithinCampaign(
  value: string,
  campaign: CampaignRecord,
  today: string
): { kind: string; message: string } | null {
  if (!value) {
    return null;
  }
  if (value > today) {
    return { kind: 'future', message: 'The date cannot be in the future' };
  }
  if (value < campaign.startDate || value > campaign.endDate) {
    const format = new LocalDatePipe();
    return {
      kind: 'outside_campaign',
      message: `Must fall within the campaign (${format.transform(campaign.startDate)} – ${format.transform(campaign.endDate)})`
    };
  }
  return null;
}

export function toNewDonation(value: DonationFormModel, currency: CurrencyCode, now: Date, today: string): NewDonation {
  const donatedAt = value.donatedAt === today ? now : atTime(fromIsoDate(value.donatedAt), 12);
  return {
    donor: {
      firstName: value.donor.firstName.trim(),
      lastName: value.donor.lastName.trim(),
      email: value.donor.email.trim().toLowerCase()
    },
    amount: toMinorUnits(value.amount ?? 0),
    currency,
    frequency: value.frequency,
    paymentMethod: value.paymentMethod as PaymentMethod,
    fundraiserId: value.fundraiserId,
    donatedAt: donatedAt.toISOString()
  };
}

/**
 * Manual donation entry built on Signal Forms: the schema declares the rules,
 * `submit()` runs them, and the server's business answers (duplicate donor)
 * are mapped back onto the field they concern.
 */
@Component({
  selector: 'app-add-donation-form',
  imports: [FormField],
  templateUrl: './add-donation-form.html',
  styleUrl: './add-donation-form.scss'
})
export class AddDonationForm {
  readonly campaign = input.required<CampaignRecord>();
  readonly fundraisers = input.required<FundraiserRecord[]>();
  readonly created = output<DonationRecord>();
  readonly cancelled = output();

  private readonly donationApi = inject(DonationApi);

  protected today = toIsoDate(new Date());
  protected paymentMethods = PAYMENT_METHODS;
  protected paymentMethodLabels = PAYMENT_METHOD_LABELS;
  protected frequencies = Object.values(DonationFrequency);
  protected frequencyLabels = DONATION_FREQUENCY_LABELS;
  protected minAmount = MIN_DONATION_EUR;
  protected maxAmount = MAX_DONATION_EUR;
  protected readonly maxDate = computed(() => latestAllowedDate(this.campaign(), this.today));

  /** Writable form model that re-seeds itself when the campaign changes. */
  readonly model = linkedSignal<DonationFormModel>(() => emptyModel(this.campaign(), this.today));

  readonly form = form(this.model, (path) => {
    required(path.donor.firstName, { message: 'First name is required' });
    maxLength(path.donor.firstName, 60, { message: 'Use at most 60 characters' });
    required(path.donor.lastName, { message: 'Last name is required' });
    maxLength(path.donor.lastName, 60, { message: 'Use at most 60 characters' });
    required(path.donor.email, { message: 'Email is required' });
    email(path.donor.email, { message: 'Enter a valid email address' });
    required(path.amount, { message: 'Amount is required' });
    min(path.amount, MIN_DONATION_EUR, { message: `Minimum donation is €${MIN_DONATION_EUR}` });
    max(path.amount, MAX_DONATION_EUR, { message: `Maximum donation is €${MAX_DONATION_EUR.toLocaleString('en-IE')}` });
    required(path.paymentMethod, { message: 'Choose a payment method' });
    required(path.fundraiserId, { message: 'Choose the fundraiser who collected it' });
    required(path.donatedAt, { message: 'Date is required' });
    validate(path.donatedAt, ({ value }) => dateWithinCampaign(value(), this.campaign(), this.today));
  });

  /** Failure of the request itself (not a validation answer); the entered values are kept. */
  protected readonly requestError = signal<string | null>(null);
  protected readonly submitting = computed(() => this.form().submitting());

  constructor() {
    // The dialog calls showModal() before this form exists, so the form places the initial focus itself.
    afterNextRender(() => this.form.donor.firstName().focusBoundControl());
  }

  showError<T>(field: FieldTree<T>): boolean {
    return field().touched() && field().invalid();
  }

  firstError<T>(field: FieldTree<T>): string {
    return field().errors()[0]?.message ?? 'Check this value';
  }

  async save(): Promise<void> {
    this.requestError.set(null);
    await submit(this.form, {
      action: async (field) => {
        const campaign = this.campaign();
        try {
          const result = await this.donationApi.addDonation(
            campaign.id,
            toNewDonation(field().value(), campaign.currency, new Date(), this.today)
          );
          if (result.status === 'duplicate_donor') {
            const when = new LocalDatePipe().transform(result.existing.donatedAt);
            return {
              fieldTree: field.donor.email,
              kind: 'duplicate_donor',
              message: `This donor already signed up on ${when}. Each donor can sign up once per campaign.`
            };
          }
          this.created.emit(result.donation);
          return null;
        } catch (error) {
          this.requestError.set(errorMessage(error));
          return null;
        }
      },
      onInvalid: (field) => field().errorSummary()[0]?.fieldTree().focusBoundControl()
    });
  }
}
