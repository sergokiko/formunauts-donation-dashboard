import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyCode, formatMoney } from '../../domain/shared/money';

/** `{{ amountInMinorUnits | money }}` or `{{ amountInMinorUnits | money: { compact: true } }}`. */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(
    minorUnits: number | null | undefined,
    options: { compact?: boolean; currency?: CurrencyCode } = {}
  ): string {
    return minorUnits === null || minorUnits === undefined ? '' : formatMoney(minorUnits, options);
  }
}
