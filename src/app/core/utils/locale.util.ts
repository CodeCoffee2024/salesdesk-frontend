import { LOCALE_BY_COUNTRY, LOCALE_BY_CURRENCY } from '../constants/locale.constants';

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'USD';

/**
 * Infers a BCP-47 locale tag from a currency code and (optionally) a target
 * country — used to drive `Intl.NumberFormat(locale, { style: 'currency',
 * currency })` everywhere an amount is rendered (TASK-029). The country wins
 * when both are known (a EUR invoice sent to a German client formats as
 * "1.250,00 €"), falling back to the currency's own typical locale, then to
 * en-US. Never returns a currency symbol directly — that's `Intl.NumberFormat`'s
 * job once it has this locale.
 */
export function resolveLocale(currencyCode?: string | null, countryCode?: string | null): string {
  if (countryCode) {
    const byCountry = LOCALE_BY_COUNTRY[countryCode.toUpperCase()];
    if (byCountry) {
      return byCountry;
    }
  }

  if (currencyCode) {
    const byCurrency = LOCALE_BY_CURRENCY[currencyCode.toUpperCase()];
    if (byCurrency) {
      return byCurrency;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Formats a monetary amount using `Intl.NumberFormat` with a locale inferred
 * from the currency/country pair — the single formatting path every page
 * (Live Preview, Public Client Portal, PDF export, Dashboard) should go
 * through instead of hardcoding `$`/`.toFixed(2)`. Falls back to a plain
 * en-US/USD format if the currency code isn't valid ISO 4217 (e.g. still
 * empty while a form is being filled in).
 */
export function formatCurrency(amount: number, currencyCode?: string | null, countryCode?: string | null): string {
  const currency = (currencyCode || DEFAULT_CURRENCY).toUpperCase();
  const locale = resolveLocale(currency, countryCode);

  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return new Intl.NumberFormat(DEFAULT_LOCALE, { style: 'currency', currency: DEFAULT_CURRENCY }).format(amount);
  }
}

/**
 * jsPDF's standard 14 fonts (Helvetica/Times/Courier) only carry WinAnsiEncoding
 * (Windows-1252) glyphs — Latin-1 (U+00A0-U+00FF: accented letters, £, ¥, ¢, the
 * non-breaking space some locales format with, etc.) plus a handful of extras
 * WinAnsi adds outside that range, of which € (U+20AC) is the only one relevant
 * here. ₱ (PHP), ₹ (INR), ₩ (KRW), ₦ (NGN), ₫ (VND) and most other currency
 * signs live well outside both, so `doc.text()` silently drops or mangles them.
 * There's no embedded Unicode font to fall back on, so for those currencies the
 * exported PDF uses the plain ISO code ("PHP 450.00") instead of the symbol —
 * unambiguous and guaranteed renderable, rather than a blank box.
 */
const WIN_ANSI_EXTRA_SAFE_CODEPOINTS = new Set([0x20ac]); // €, WinAnsi's one addition beyond Latin-1

export function formatCurrencyForPdf(amount: number, currencyCode?: string | null, countryCode?: string | null): string {
  const formatted = formatCurrency(amount, currencyCode, countryCode);
  const hasUnsafeGlyph = Array.from(formatted).some((char) => {
    const codePoint = char.codePointAt(0) ?? 0;
    return codePoint > 0xff && !WIN_ANSI_EXTRA_SAFE_CODEPOINTS.has(codePoint);
  });

  if (!hasUnsafeGlyph) {
    return formatted;
  }

  const currency = (currencyCode || DEFAULT_CURRENCY).toUpperCase();
  const locale = resolveLocale(currency, countryCode);

  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'code' }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
