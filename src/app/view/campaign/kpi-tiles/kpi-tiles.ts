import { Component, computed, input } from '@angular/core';
import { CampaignPerformance } from '../../../domain/campaign/entity/campaign-performance';
import { formatMoney } from '../../../domain/shared/money';
import { formatInteger, formatPercent } from '../../common/format';
import { Skeleton } from '../../common/skeleton/skeleton';

type BadgeTone = 'success' | 'neutral' | 'warning' | 'danger';

interface Badge {
  text: string;
  tone: BadgeTone;
  glyph: string;
}

interface Tile {
  label: string;
  value: string;
  detail: string;
  badge: Badge | null;
}

@Component({
  selector: 'app-kpi-tiles',
  imports: [Skeleton],
  templateUrl: './kpi-tiles.html',
  styleUrl: './kpi-tiles.scss'
})
export class KpiTiles {
  readonly performance = input.required<CampaignPerformance | null>();
  readonly loading = input(false);

  protected placeholders = [0, 1, 2, 3];

  protected readonly tiles = computed<Tile[]>(() => {
    const performance = this.performance();
    if (!performance) {
      return [];
    }
    return [
      {
        label: 'Raised',
        value: formatMoney(performance.overview.raisedAmount),
        detail: `${formatPercent(performance.progressPercent())} of ${formatMoney(performance.overview.campaign.goalAmount, { compact: true })} goal`,
        badge: paceBadge(performance)
      },
      {
        label: 'Unique donors',
        value: formatInteger(performance.overview.uniqueDonors),
        detail: `${formatPercent(performance.donorProgressPercent())} of ${formatInteger(performance.overview.campaign.donorGoal)} target`,
        badge: null
      },
      timeTile(performance),
      {
        label: 'Average donation',
        value: formatMoney(performance.overview.averageAmount),
        detail: `${formatInteger(performance.overview.donationCount)} donations · ${formatPercent(performance.monthlyShare())} monthly`,
        badge: null
      }
    ];
  });
}

function timeTile(performance: CampaignPerformance): Tile {
  switch (performance.phase()) {
    case 'upcoming':
      return {
        label: 'Starts in',
        value: `${formatInteger(performance.daysUntilStart())} days`,
        detail: `${formatInteger(performance.totalDays())} days planned`,
        badge: null
      };
    case 'ended':
      return {
        label: 'Campaign ended',
        value: `${formatInteger(performance.totalDays())} days`,
        detail: 'Full duration completed',
        badge: null
      };
    default:
      return {
        label: 'Days remaining',
        value: formatInteger(performance.remainingDays()),
        detail: `${formatInteger(performance.elapsedDays())} of ${formatInteger(performance.totalDays())} days elapsed`,
        badge: null
      };
  }
}

function paceBadge(performance: CampaignPerformance): Badge {
  if (performance.phase() === 'ended') {
    return performance.goalReached()
      ? { text: 'Goal reached', tone: 'success', glyph: '✓' }
      : { text: 'Goal missed', tone: 'danger', glyph: '✕' };
  }
  if (performance.phase() === 'upcoming') {
    return { text: 'Not started', tone: 'neutral', glyph: '○' };
  }
  switch (performance.pace()) {
    case 'ahead':
      return { text: 'Ahead of pace', tone: 'success', glyph: '▲' };
    case 'behind':
      return { text: 'Behind pace', tone: 'warning', glyph: '▼' };
    default:
      return { text: 'On track', tone: 'neutral', glyph: '●' };
  }
}
