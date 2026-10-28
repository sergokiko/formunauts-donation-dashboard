import { Component, computed, effect, inject, input, resource, untracked, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppError, ErrorCode, errorMessage } from '../../../core/app-error';
import { toIsoDate } from '../../../core/dates';
import { CampaignPerformance } from '../../../domain/campaign/entity/campaign-performance';
import { CAMPAIGN_CHANNEL_LABELS } from '../../../domain/campaign/enum/campaign-channel';
import { CampaignApi } from '../../../api/campaign-api';
import { DonationsStore } from '../../donations/donations-store';
import { DonationApi } from '../../../api/donation-api';
import { DonationRecord } from '../../../domain/donation/types/donation-types';
import { formatMoney } from '../../../domain/shared/money';
import { DailyDonationsChart } from '../../campaign/daily-donations-chart/daily-donations-chart';
import { GoalProgressChart } from '../../campaign/goal-progress-chart/goal-progress-chart';
import { KpiTiles } from '../../campaign/kpi-tiles/kpi-tiles';
import { PaymentMethodChart } from '../../campaign/payment-method-chart/payment-method-chart';
import { ErrorState } from '../../common/error-state/error-state';
import { LocalDatePipe } from '../../common/local-date-pipe';
import { Skeleton } from '../../common/skeleton/skeleton';
import { AddDonationDialog } from '../../donations/add-donation-dialog/add-donation-dialog';
import { DonationsList } from '../../donations/donations-list/donations-list';
import { AppHeader } from '../../shell/app-header/app-header';
import { ToastService } from '../../shell/toast-service';

@Component({
  selector: 'app-campaign-dashboard-page',
  imports: [
    AppHeader,
    KpiTiles,
    GoalProgressChart,
    DailyDonationsChart,
    PaymentMethodChart,
    DonationsList,
    AddDonationDialog,
    ErrorState,
    Skeleton,
    LocalDatePipe
  ],
  providers: [DonationsStore],
  templateUrl: './campaign-dashboard-page.html',
  styleUrl: './campaign-dashboard-page.scss'
})
export class CampaignDashboardPage {
  /** Route parameter; absent on `/`, where the first campaign is shown. */
  readonly campaignId = input<string>();

  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly campaignApi = inject(CampaignApi);
  private readonly donationApi = inject(DonationApi);
  private readonly donations = inject(DonationsStore);
  private readonly dialog = viewChild.required(AddDonationDialog);

  protected readonly campaigns = resource({ loader: () => this.campaignApi.listCampaigns() });
  protected readonly fundraisers = resource({ loader: () => this.donationApi.listFundraisers() });
  protected readonly activeCampaignId = computed(() => this.campaignId() ?? this.campaigns.value()?.[0]?.id);
  protected readonly overview = resource({
    params: () => this.activeCampaignId(),
    loader: ({ params }) => this.campaignApi.getCampaignOverview(params)
  });

  protected today = toIsoDate(new Date());
  protected channelLabels = CAMPAIGN_CHANNEL_LABELS;
  protected readonly performance = computed(() =>
    this.overview.hasValue() ? new CampaignPerformance(this.overview.value(), new Date()) : null
  );
  protected readonly campaign = computed(() => this.performance()?.overview.campaign ?? null);
  protected readonly phase = computed(() => this.performance()?.phase() ?? null);
  /** Donations can be recorded for running and ended campaigns, not before the start date. */
  protected readonly canAddDonation = computed(() => this.campaign() !== null && this.phase() !== 'upcoming');
  protected readonly campaignList = computed(() => this.campaigns.value() ?? []);
  protected readonly hasNoCampaigns = computed(() => this.campaigns.hasValue() && this.campaignList().length === 0);
  protected readonly fundraiserList = computed(() => this.fundraisers.value() ?? []);
  protected readonly isCampaignMissing = computed(() => {
    const error = this.overview.error();
    return error instanceof AppError && error.code === ErrorCode.NotFound;
  });

  constructor() {
    effect(() => {
      const id = this.activeCampaignId();
      if (id !== undefined) {
        untracked(() => this.donations.setCampaign(id));
      }
    });
  }

  switchCampaign(campaignId: string) {
    this.router.navigate(['/campaigns', campaignId]);
  }

  openDialog() {
    this.dialog().open();
  }

  onCreated(donation: DonationRecord) {
    void this.donations.reload();
    this.overview.reload();
    const amount = formatMoney(donation.amount, { currency: donation.currency });
    this.toast.success(`${amount} donation by ${donation.donor.firstName} ${donation.donor.lastName} recorded.`);
  }

  retryAll() {
    this.campaigns.reload();
    this.overview.reload();
    this.fundraisers.reload();
  }

  describe(error: unknown): string {
    return errorMessage(error);
  }
}
