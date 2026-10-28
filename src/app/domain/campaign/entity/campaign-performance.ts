import { fromIsoDate, startOfDay, toIsoDate } from '../../../core/dates';
import { percent } from '../../shared/money';
import { CampaignOverviewRecord } from '../types/campaign-types';

export type CampaignPhase = 'upcoming' | 'active' | 'ended';
export type Pace = 'ahead' | 'on_track' | 'behind';

const DAY_MS = 24 * 60 * 60 * 1000;
const ON_TRACK_TOLERANCE = 5;


export class CampaignPerformance {
  constructor(
    readonly overview: CampaignOverviewRecord,
    private readonly today: Date
  ) {}

  progressPercent(): number {
    return percent(this.overview.raisedAmount, this.overview.campaign.goalAmount);
  }

  donorProgressPercent(): number {
    return percent(this.overview.uniqueDonors, this.overview.campaign.donorGoal);
  }

  monthlyShare(): number {
    return percent(this.overview.monthlyDonorCount, this.overview.donationCount);
  }

  totalDays(): number {
    return this.dayIndex(fromIsoDate(this.overview.campaign.endDate)) + 1;
  }

  elapsedDays(): number {
    return clamp(this.dayIndex(this.today) + 1, 0, this.totalDays());
  }

  remainingDays(): number {
    return this.totalDays() - this.elapsedDays();
  }

  daysUntilStart(): number {
    return Math.max(0, -this.dayIndex(this.today));
  }

  timeElapsedPercent(): number {
    return (this.elapsedDays() / this.totalDays()) * 100;
  }

  phase(): CampaignPhase {
    const today = toIsoDate(this.today);
    if (today < this.overview.campaign.startDate) {
      return 'upcoming';
    }
    if (today > this.overview.campaign.endDate) {
      return 'ended';
    }
    return 'active';
  }

  pace(): Pace {
    const gap = this.progressPercent() - this.timeElapsedPercent();
    if (gap > ON_TRACK_TOLERANCE) {
      return 'ahead';
    }
    if (gap < -ON_TRACK_TOLERANCE) {
      return 'behind';
    }
    return 'on_track';
  }

  goalReached(): boolean {
    return this.overview.raisedAmount >= this.overview.campaign.goalAmount;
  }

  private dayIndex(date: Date): number {
    const start = fromIsoDate(this.overview.campaign.startDate);
    return Math.round((startOfDay(date).getTime() - start.getTime()) / DAY_MS);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
