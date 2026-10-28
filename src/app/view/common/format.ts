import { APP_LOCALE } from '../../domain/shared/locale';

const integer = new Intl.NumberFormat(APP_LOCALE, { maximumFractionDigits: 0 });

export function formatInteger(value: number): string {
  return integer.format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
