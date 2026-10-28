import { Component, computed, input } from '@angular/core';
import { scaleLinear } from 'd3';
import { PaymentMethodShare } from '../../../domain/campaign/types/campaign-types';
import { PAYMENT_METHOD_LABELS } from '../../../domain/donation/enum/payment-method';
import { formatMoney } from '../../../domain/shared/money';
import { formatInteger, formatPercent } from '../../common/format';

const WIDTH = 100;
const BAR_HEIGHT = 14;
const COLORS = [
  'var(--chart-primary)',
  'var(--chart-secondary)',
  'var(--chart-tertiary)',
  'var(--chart-quaternary)',
  'var(--chart-quinary)'
];

interface Segment {
  method: string;
  label: string;
  x: number;
  width: number;
  color: string;
  amount: string;
  share: string;
  count: string;
}

/** Amount raised per payment method as one stacked bar with a legend. */
@Component({
  selector: 'app-payment-method-chart',
  templateUrl: './payment-method-chart.html',
  styleUrl: './payment-method-chart.scss'
})
export class PaymentMethodChart {
  readonly shares = input.required<PaymentMethodShare[]>();

  protected width = WIDTH;
  protected barHeight = BAR_HEIGHT;

  protected readonly segments = computed<Segment[]>(() => {
    const shares = [...this.shares()].sort((a, b) => b.amount - a.amount);
    const total = shares.reduce((sum, share) => sum + share.amount, 0);
    const x = scaleLinear()
      .domain([0, Math.max(total, 1)])
      .range([0, WIDTH]);
    let offset = 0;
    return shares.map((share, index) => {
      const segment: Segment = {
        method: share.method,
        label: PAYMENT_METHOD_LABELS[share.method],
        x: x(offset),
        width: x(share.amount),
        color: COLORS[index % COLORS.length],
        amount: formatMoney(share.amount, { compact: true }),
        share: formatPercent(total === 0 ? 0 : (share.amount / total) * 100),
        count: `${formatInteger(share.count)} sign-ups`
      };
      offset += share.amount;
      return segment;
    });
  });
}
