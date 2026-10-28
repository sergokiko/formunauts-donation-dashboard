import { Component, computed, input } from '@angular/core';
import { arc } from 'd3';
import { CampaignPerformance } from '../../../domain/campaign/entity/campaign-performance';
import { formatMoney } from '../../../domain/shared/money';
import { formatInteger, formatPercent } from '../../common/format';

const SIZE = 200;
const TAU = 2 * Math.PI;
const moneyRing = arc<number>()
  .innerRadius(76)
  .outerRadius(94)
  .cornerRadius(9)
  .startAngle(0)
  .endAngle((share) => share * TAU);
const donorRing = arc<number>()
  .innerRadius(54)
  .outerRadius(68)
  .cornerRadius(7)
  .startAngle(0)
  .endAngle((share) => share * TAU);

@Component({
  selector: 'app-goal-progress-chart',
  templateUrl: './goal-progress-chart.html',
  styleUrl: './goal-progress-chart.scss'
})
export class GoalProgressChart {
  readonly performance = input.required<CampaignPerformance>();

  protected size = SIZE;
  protected tracks = { money: moneyRing(1) ?? '', donors: donorRing(1) ?? '' };

  protected readonly paths = computed(() => {
    const performance = this.performance();
    return {
      money: moneyRing(Math.min(performance.progressPercent() / 100, 1)) ?? '',
      donors: donorRing(Math.min(performance.donorProgressPercent() / 100, 1)) ?? ''
    };
  });

  protected readonly moneyPercent = computed(() => formatPercent(this.performance().progressPercent()));
  protected readonly donorPercent = computed(() => formatPercent(this.performance().donorProgressPercent()));
  protected readonly raisedLabel = computed(() => {
    const performance = this.performance();
    return `${formatMoney(performance.overview.raisedAmount, { compact: true })} / ${formatMoney(performance.overview.campaign.goalAmount, { compact: true })}`;
  });
  protected readonly donors = computed(() => formatInteger(this.performance().overview.uniqueDonors));
  protected readonly donorGoal = computed(() => formatInteger(this.performance().overview.campaign.donorGoal));

  protected readonly summary = computed(() => {
    const performance = this.performance();
    return (
      `Raised ${formatMoney(performance.overview.raisedAmount)} of the ${formatMoney(performance.overview.campaign.goalAmount)} goal (${this.moneyPercent()}); ` +
      `${this.donors()} of ${this.donorGoal()} donors (${this.donorPercent()}).`
    );
  });
}
