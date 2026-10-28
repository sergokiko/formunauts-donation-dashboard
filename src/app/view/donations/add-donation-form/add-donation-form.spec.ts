import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DonationApi } from '../../../api/donation-api';
import { CampaignChannel } from '../../../domain/campaign/enum/campaign-channel';
import { CampaignRecord } from '../../../domain/campaign/types/campaign-types';
import { DonationFrequency } from '../../../domain/donation/enum/donation-frequency';
import { PaymentMethod } from '../../../domain/donation/enum/payment-method';
import { AddDonationResult, DonationRecord, NewDonation } from '../../../domain/donation/types/donation-types';
import { AddDonationForm } from './add-donation-form';

const campaign: CampaignRecord = {
  id: 'cmp_1',
  name: 'Summer streets',
  charityName: 'Ocean Trust',
  channel: CampaignChannel.Street,
  startDate: '2026-06-01',
  endDate: '2026-12-31',
  currency: 'EUR',
  goalAmount: 100_000_00,
  donorGoal: 1000
};

const existing: DonationRecord = {
  id: 'don_existing',
  campaignId: campaign.id,
  fundraiserId: 'fr_01',
  donor: { firstName: 'Mia', lastName: 'Hofer', email: 'mia.hofer@example.org' },
  amount: 1500,
  currency: 'EUR',
  frequency: DonationFrequency.Monthly,
  paymentMethod: PaymentMethod.SepaDirectDebit,
  donatedAt: '2026-06-02T09:15:00.000Z'
};

/** Records what the form sends and answers with whatever `result` is set to. */
class FakeDonationApi implements Pick<DonationApi, 'addDonation'> {
  readonly calls: NewDonation[] = [];
  result: AddDonationResult = { status: 'created', donation: { ...existing, id: 'don_new' } };

  async addDonation(_campaignId: string, donation: NewDonation): Promise<AddDonationResult> {
    this.calls.push(donation);
    return this.result;
  }
}

describe('AddDonationForm', () => {
  let fixture: ComponentFixture<AddDonationForm>;
  let api: FakeDonationApi;
  let created: DonationRecord[];

  const element = <T extends HTMLElement>(selector: string): T => {
    const found = (fixture.nativeElement as HTMLElement).querySelector<T>(selector);
    if (!found) {
      throw new Error(`No element matches ${selector}`);
    }
    return found;
  };

  const type = (selector: string, value: string) => {
    const input = element<HTMLInputElement | HTMLSelectElement>(selector);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const submitForm = async () => {
    element<HTMLFormElement>('form').dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    api = new FakeDonationApi();
    created = [];
    await TestBed.configureTestingModule({
      imports: [AddDonationForm],
      providers: [{ provide: DonationApi, useValue: api }]
    }).compileComponents();
    fixture = TestBed.createComponent(AddDonationForm);
    fixture.componentRef.setInput('campaign', campaign);
    fixture.componentRef.setInput('fundraisers', [{ id: 'fr_01', firstName: 'Aisha', lastName: 'Rahman' }]);
    fixture.componentInstance.created.subscribe((donation) => created.push(donation));
    await fixture.whenStable();

    type('#donor-first-name', 'Mia');
    type('#donor-last-name', 'Hofer');
    type('#donor-email', 'Mia.Hofer@example.org');
    type('#amount', '25.50');
    type('#payment-method', PaymentMethod.CreditCard);
    type('#fundraiser', 'fr_01');
    type('#donated-at', '2026-10-20');
  });

  it('sends the donation in minor units with a normalised email and emits the created record', async () => {
    await submitForm();

    expect(api.calls).toHaveLength(1);
    expect(api.calls[0]).toMatchObject({
      donor: { firstName: 'Mia', lastName: 'Hofer', email: 'mia.hofer@example.org' },
      amount: 2550,
      currency: 'EUR',
      frequency: DonationFrequency.Monthly,
      paymentMethod: PaymentMethod.CreditCard,
      fundraiserId: 'fr_01'
    });
    expect(api.calls[0].donatedAt).toMatch(/^2026-10-20T/);
    expect(created.map((d) => d.id)).toEqual(['don_new']);
  });

  it('puts the duplicate-donor answer on the email field instead of emitting', async () => {
    api.result = { status: 'duplicate_donor', existing };
    await submitForm();

    expect(created).toHaveLength(0);
    expect(element('#donor-email-error').textContent).toContain('already signed up on 2 Jun 2026');
    expect(element<HTMLInputElement>('#donor-email').getAttribute('aria-invalid')).toBe('true');
  });
});
