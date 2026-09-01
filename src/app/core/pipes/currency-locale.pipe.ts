import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrency } from '../utils/locale.util';

/**
 * Locale-aware currency formatter (TASK-029) — replaces Angular's built-in
 * `currency` pipe (which silently assumes USD/en-US) everywhere a document's
 * own currency/target country needs to drive the display, e.g.
 * `{{ doc.total | currencyLocale:doc.currency:doc.clientCountry }}`.
 *
 * Thin wrapper around `Intl.NumberFormat` via `core/utils/locale.util.ts` — no
 * hardcoded symbols or tax rates, per the TASK-029 guardrail.
 */
@Pipe({ name: 'currencyLocale' })
export class CurrencyLocalePipe implements PipeTransform {
  transform(value: number | null | undefined, currencyCode?: string | null, countryCode?: string | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }

    return formatCurrency(value, currencyCode, countryCode);
  }
}
