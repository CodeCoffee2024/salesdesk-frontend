/**
 * Static ISO metadata for the country/currency dropdowns (Workspace Settings,
 * Document Builder overrides) and locale inference (TASK-029).
 *
 * This is deliberately metadata only — ISO 3166-1 alpha-2 codes, ISO 4217 codes,
 * and BCP-47 locale *tags* — never currency symbols or tax rates. The actual
 * symbol/format for a given (locale, currency) pair is always derived at render
 * time via `Intl.NumberFormat`, never looked up in a table here. See
 * `core/utils/locale.util.ts`.
 */

export interface IsoOption {
  code: string;
  name: string;
}

/** A representative set of countries — not exhaustive, but enough to cover SalesDesk's target markets without pretending to be a full ISO 3166-1 registry. */
export const ISO_COUNTRIES: IsoOption[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'PH', name: 'Philippines' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'United Arab Emirates' }
];

export const ISO_CURRENCIES: IsoOption[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' }
];

/**
 * BCP-47 locale tag a country's documents should format numbers/dates in. Used
 * to pick the *shape* of a formatted amount (1,250.00 vs 1.250,00) — the symbol
 * itself still always comes from `Intl.NumberFormat`'s own currency data, never
 * from a table here. Falls back to the currency's own typical locale (see
 * `core/utils/locale.util.ts`) when the country isn't in this map, and to
 * 'en-US' after that.
 */
export const LOCALE_BY_COUNTRY: Record<string, string> = {
  US: 'en-US',
  CA: 'en-CA',
  GB: 'en-GB',
  IE: 'en-IE',
  DE: 'de-DE',
  FR: 'fr-FR',
  ES: 'es-ES',
  IT: 'it-IT',
  NL: 'nl-NL',
  PT: 'pt-PT',
  CH: 'de-CH',
  SE: 'sv-SE',
  NO: 'nb-NO',
  DK: 'da-DK',
  PH: 'en-PH',
  JP: 'ja-JP',
  CN: 'zh-CN',
  IN: 'en-IN',
  SG: 'en-SG',
  AU: 'en-AU',
  NZ: 'en-NZ',
  MX: 'es-MX',
  BR: 'pt-BR',
  ZA: 'en-ZA',
  AE: 'ar-AE'
};

/** A country's own typical currency. Used to guess a landing-page visitor's likely currency from their detected country (see `core/utils/currency-estimate.util.ts`). Still pure ISO metadata, never a rate. */
export const CURRENCY_BY_COUNTRY: Record<string, string> = {
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  IE: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PH: 'PHP',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  SG: 'SGD',
  AU: 'AUD',
  NZ: 'NZD',
  MX: 'MXN',
  BR: 'BRL',
  ZA: 'ZAR',
  AE: 'AED'
};

/** Fallback locale per currency, used when no target country is known — e.g. a dashboard total normalized into the workspace's base currency with no single client country attached. */
export const LOCALE_BY_CURRENCY: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  PHP: 'en-PH',
  JPY: 'ja-JP',
  CAD: 'en-CA',
  AUD: 'en-AU',
  NZD: 'en-NZ',
  SGD: 'en-SG',
  INR: 'en-IN',
  CNY: 'zh-CN',
  CHF: 'de-CH',
  MXN: 'es-MX',
  BRL: 'pt-BR',
  ZAR: 'en-ZA',
  AED: 'ar-AE',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK'
};

/**
 * Local tax label a country conventionally uses — informational copy only (e.g.
 * labelling a future tax line as "VAT" instead of "Sales Tax"), never a rate.
 * SalesDesk doesn't compute tax yet, so this is purely a hint shown next to the
 * Country selector in Workspace Settings.
 */
export const TAX_LABEL_BY_COUNTRY: Record<string, string> = {
  US: 'Sales Tax',
  CA: 'GST/HST',
  GB: 'VAT',
  IE: 'VAT',
  DE: 'VAT',
  FR: 'VAT',
  ES: 'VAT',
  IT: 'VAT',
  NL: 'VAT',
  PT: 'VAT',
  CH: 'VAT',
  SE: 'VAT',
  NO: 'VAT',
  DK: 'VAT',
  PH: 'VAT',
  JP: 'Consumption Tax',
  CN: 'VAT',
  IN: 'GST',
  SG: 'GST',
  AU: 'GST',
  NZ: 'GST',
  MX: 'IVA',
  BR: 'ICMS',
  ZA: 'VAT',
  AE: 'VAT'
};

export function taxLabelForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) {
    return 'Tax';
  }
  return TAX_LABEL_BY_COUNTRY[countryCode.toUpperCase()] ?? 'Tax';
}
