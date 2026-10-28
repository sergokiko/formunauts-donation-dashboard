import { APP_LOCALE } from './locale';

export type CurrencyCode = 'EUR';

/**
 * Amounts travel through the app as integer minor units (cents), so sums never
 * suffer floating-point drift. These helpers are the only places where cents
 * become text or where user input becomes cents.
 */
export function formatMoney(minorUnits: number, options: { compact?: boolean; currency?: CurrencyCode } = {}): string {
  const { compact = false, currency = 'EUR' } = options;
  return new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2
  }).format(minorUnits / 100);
}

export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

export function percent(part: number, total: number): number {
  return total <= 0 ? 0 : (part / total) * 100;
}
