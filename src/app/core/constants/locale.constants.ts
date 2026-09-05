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

/**
 * A representative set of IANA time zone ids — not exhaustive, but enough to
 * cover SalesDesk's target markets, including every zone a multi-zone country
 * like the US, Canada, or Australia needs (a single "US" entry would silently
 * be wrong for 5/6 of the country). Used for the Time Zone selector in
 * Workspace Settings — document/reminder emails localize their activity
 * timeline into whichever zone is picked here instead of raw UTC.
 */
export const IANA_TIMEZONES: IsoOption[] = [
  { code: 'UTC', name: 'UTC' },
  { code: 'America/Los_Angeles', name: 'Pacific Time (US & Canada)' },
  { code: 'America/Denver', name: 'Mountain Time (US & Canada)' },
  { code: 'America/Chicago', name: 'Central Time (US & Canada)' },
  { code: 'America/New_York', name: 'Eastern Time (US & Canada)' },
  { code: 'America/Anchorage', name: 'Alaska Time' },
  { code: 'Pacific/Honolulu', name: 'Hawaii Time' },
  { code: 'America/Halifax', name: 'Atlantic Time (Canada)' },
  { code: 'America/St_Johns', name: 'Newfoundland Time' },
  { code: 'America/Mexico_City', name: 'Mexico City' },
  { code: 'America/Sao_Paulo', name: 'Sao Paulo' },
  { code: 'Europe/London', name: 'London' },
  { code: 'Europe/Dublin', name: 'Dublin' },
  { code: 'Europe/Lisbon', name: 'Lisbon' },
  { code: 'Europe/Madrid', name: 'Madrid' },
  { code: 'Europe/Paris', name: 'Paris' },
  { code: 'Europe/Berlin', name: 'Berlin' },
  { code: 'Europe/Amsterdam', name: 'Amsterdam' },
  { code: 'Europe/Rome', name: 'Rome' },
  { code: 'Europe/Zurich', name: 'Zurich' },
  { code: 'Europe/Stockholm', name: 'Stockholm' },
  { code: 'Europe/Oslo', name: 'Oslo' },
  { code: 'Europe/Copenhagen', name: 'Copenhagen' },
  { code: 'Africa/Johannesburg', name: 'Johannesburg' },
  { code: 'Asia/Dubai', name: 'Dubai' },
  { code: 'Asia/Kolkata', name: 'Mumbai, New Delhi' },
  { code: 'Asia/Singapore', name: 'Singapore' },
  { code: 'Asia/Manila', name: 'Manila' },
  { code: 'Asia/Shanghai', name: 'Shanghai' },
  { code: 'Asia/Tokyo', name: 'Tokyo' },
  { code: 'Australia/Perth', name: 'Perth' },
  { code: 'Australia/Sydney', name: 'Sydney' },
  { code: 'Pacific/Auckland', name: 'Auckland' }
];

export function taxLabelForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) {
    return 'Tax';
  }
  return TAX_LABEL_BY_COUNTRY[countryCode.toUpperCase()] ?? 'Tax';
}
