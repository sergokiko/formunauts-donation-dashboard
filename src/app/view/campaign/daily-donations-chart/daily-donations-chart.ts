import { Component, computed, ElementRef, inject, input } from '@angular/core';
import { line, max, scaleBand, scaleLinear } from 'd3';
import { elementWidth } from '../../../core/utils/element-width';
import { DailyPoint } from '../../../domain/campaign/types/campaign-types';
import { formatMoney } from '../../../domain/shared/money';
import { LocalDatePipe } from '../../common/local-date-pipe';
import { MoneyPipe } from '../../common/money-pipe';

const HEIGHT = 260;
const MARGIN = { top: 16, right: 56, bottom: 32, left: 56 };
/** Horizontal room one date label needs; the tick count adapts to the chart width. */
const X_LABEL_WIDTH = 64;

interface Bar {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface Tick {
  position: number;
  label: string;
}

/**
 * Daily sign-ups (bars, left axis) with the cumulative amount raised against
 * the goal (line and dashed goal, right axis). D3 only computes scales and
 * paths; Angular renders the SVG from the computed marks.
 */
@Component({
  selector: 'app-daily-donations-chart',
  imports: [MoneyPipe],
  templateUrl: './daily-donations-chart.html',
  styleUrl: './daily-donations-chart.scss'
})
export class DailyDonationsChart {
  readonly daily = input.required<DailyPoint[]>();
  readonly goalAmount = input.required<number>();
  readonly today = input.required<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly width = elementWidth(this.host);
  protected height = HEIGHT;
  protected margin = MARGIN;

  protected readonly pastDays = computed(() => this.daily().filter((point) => point.date <= this.today()));

  protected readonly marks = computed(() => {
    const daily = this.daily();
    const width = this.width();
    const innerLeft = MARGIN.left;
    const innerRight = width - MARGIN.right;
    const innerTop = MARGIN.top;
    const innerBottom = HEIGHT - MARGIN.bottom;

    const x = scaleBand<string>()
      .domain(daily.map((point) => point.date))
      .range([innerLeft, innerRight])
      .paddingInner(0.3);
    // A floor of 1 keeps the domain non-degenerate when nothing was raised yet (d3 would otherwise map every value to the midpoint).
    const yDaily = scaleLinear()
      .domain([0, Math.max(max(daily, (point) => point.amount) ?? 0, 1)])
      .nice()
      .range([innerBottom, innerTop]);

    const cumulative: number[] = [];
    let runningTotal = 0;
    for (const point of daily) {
      runningTotal += point.amount;
      cumulative.push(runningTotal);
    }
    const yCumulative = scaleLinear()
      .domain([0, Math.max(this.goalAmount(), runningTotal, 1)])
      .nice()
      .range([innerBottom, innerTop]);

    const pastCount = this.pastDays().length;
    const cumulativePath =
      line<number>()
        .x((_, index) => (x(daily[index].date) ?? 0) + x.bandwidth() / 2)
        .y((value) => yCumulative(value))(cumulative.slice(0, pastCount)) ?? '';

    const maxTicks = Math.max(2, Math.floor((innerRight - innerLeft) / X_LABEL_WIDTH));
    const tickStep = Math.max(1, Math.ceil(daily.length / maxTicks));
    const shortDate = new LocalDatePipe();
    const todayBand = x(this.today());

    return {
      bars: daily.map((point): Bar => ({
        key: point.date,
        x: x(point.date) ?? 0,
        y: yDaily(point.amount),
        width: x.bandwidth(),
        height: innerBottom - yDaily(point.amount),
        label: `${shortDate.transform(point.date)}: ${point.count} sign-ups, ${formatMoney(point.amount)}`
      })),
      cumulativePath,
      goalY: yCumulative(this.goalAmount()),
      todayX: todayBand === undefined ? null : todayBand + x.bandwidth() / 2,
      leftTicks: yDaily.ticks(4).map((value): Tick => ({ position: yDaily(value), label: compact(value) })),
      rightTicks: yCumulative.ticks(4).map((value): Tick => ({ position: yCumulative(value), label: compact(value) })),
      bottomTicks: daily
        .filter((_, index) => index % tickStep === 0)
        .map((point): Tick => ({
          position: (x(point.date) ?? 0) + x.bandwidth() / 2,
          label: shortDate.transform(point.date, 'short')
        }))
    };
  });

  protected readonly summary = computed(() => {
    const past = this.pastDays();
    const raised = past.reduce((sum, point) => sum + point.amount, 0);
    const signUps = past.reduce((sum, point) => sum + point.count, 0);
    return (
      `Daily donations over the campaign: ${signUps} sign-ups so far, ${formatMoney(raised)} raised ` +
      `against a goal of ${formatMoney(this.goalAmount())}.`
    );
  });
}

function compact(minorUnits: number): string {
  return formatMoney(Math.round(minorUnits), { compact: true });
}
