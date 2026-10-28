import { Pipe, PipeTransform } from '@angular/core';
import { fromIsoDate } from '../../core/dates';
import { APP_LOCALE } from '../../domain/shared/locale';

export type LocalDateStyle = 'date' | 'dateTime' | 'short';

const FORMATS: Record<LocalDateStyle, Intl.DateTimeFormat> = {
  date: new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }),
  dateTime: new Intl.DateTimeFormat(APP_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }),
  short: new Intl.DateTimeFormat(APP_LOCALE, { day: 'numeric', month: 'short' })
};

/** Formats ISO timestamps and `YYYY-MM-DD` days in the app locale. */
@Pipe({ name: 'localDate' })
export class LocalDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, style: LocalDateStyle = 'date'): string {
    if (!value) {
      return '';
    }
    const date = typeof value === 'string' ? (value.length === 10 ? fromIsoDate(value) : new Date(value)) : value;
    return FORMATS[style].format(date);
  }
}
