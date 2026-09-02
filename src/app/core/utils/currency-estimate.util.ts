import { CURRENCY_BY_COUNTRY } from '../constants/locale.constants';

/**
 * Landing-page-only helpers for showing a visitor an approximate local-currency
 * estimate next to the USD pricing (the app doesn't process real payments yet,
 * see billing.component.html, so this is purely informational).
 *
 * Detection is fully client-side and needs no network call or third-party
 * geolocation service: it reads the browser's own IANA time zone, which is a
 * reasonable proxy for physical location without sending anything anywhere.
 * It is a best-effort guess, not identity or billing data, and a visitor using
 * a VPN or an unusual system clock will simply see the USD price with no
 * estimate, which is a safe fallback.
 */

/** One representative IANA time zone per supported country, used only to map a zone back to a country code. Not exhaustive: covers ISO_COUNTRIES from locale.constants.ts. */
const COUNTRY_BY_TIMEZONE: Record<string, string> = {
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Winnipeg': 'CA',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Lisbon': 'PT',
  'Europe/Zurich': 'CH',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Asia/Manila': 'PH',
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN',
  'Asia/Kolkata': 'IN',
  'Asia/Singapore': 'SG',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Pacific/Auckland': 'NZ',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'Africa/Johannesburg': 'ZA',
  'Asia/Dubai': 'AE'
};

/** Best-effort visitor country guess: time zone first (physical, no network call needed), then the region subtag of navigator.language, then null when neither resolves to a known country. */
export function detectVisitorCountry(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const byTimeZone = COUNTRY_BY_TIMEZONE[timeZone];
    if (byTimeZone) {
      return byTimeZone;
    }
  } catch {
    // Intl.DateTimeFormat should always exist in a modern browser; ignore if it doesn't.
  }

  const region = navigator.language?.split('-')[1]?.toUpperCase();
  if (region && CURRENCY_BY_COUNTRY[region]) {
    return region;
  }

  return null;
}

/**
 * Approximate USD reference rates for display only, not for billing (there is
 * no real payment processing yet). A rough snapshot rather than a live feed:
 * fine for "about how much that is in your currency", wrong for an invoice.
 * Revisit periodically; large currency moves will make this visibly stale.
 */
const REFERENCE_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  PHP: 56.5,
  JPY: 149,
  CAD: 1.36,
  AUD: 1.52,
  NZD: 1.66,
  SGD: 1.34,
  INR: 84,
  CNY: 7.1,
  CHF: 0.88,
  MXN: 18.5,
  BRL: 5.4,
  ZAR: 18.2,
  AED: 3.67,
  SEK: 10.4,
  NOK: 10.6,
  DKK: 6.86
};

/** Converts a USD amount to an approximate amount in the given currency, or null when there's no reference rate for it (in which case the caller should just show the USD price with no estimate). */
export function estimateFromUsd(usdAmount: number, currencyCode: string): number | null {
  const rate = REFERENCE_USD_RATES[currencyCode.toUpperCase()];
  if (!rate) {
    return null;
  }
  return usdAmount * rate;
}
