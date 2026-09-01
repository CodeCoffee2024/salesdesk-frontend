import { formatCurrency, resolveLocale } from './locale.util';

describe('resolveLocale', () => {
  it('prefers the target country locale when both country and currency are known', () => {
    expect(resolveLocale('EUR', 'DE')).toBe('de-DE');
  });

  it('falls back to the currency default locale when no country is given', () => {
    expect(resolveLocale('PHP')).toBe('en-PH');
  });

  it('falls back to en-US when neither currency nor country is recognized', () => {
    expect(resolveLocale('XYZ', 'ZZ')).toBe('en-US');
  });

  it('is case-insensitive for both codes', () => {
    expect(resolveLocale('eur', 'de')).toBe('de-DE');
  });
});

describe('formatCurrency', () => {
  it('formats USD amounts the reference way ($1,250.00)', () => {
    expect(formatCurrency(1250, 'USD', 'US')).toBe('$1,250.00');
  });

  it('formats EUR amounts for a German client with the locale-appropriate separators', () => {
    // de-DE uses '.' as the thousands separator and ',' as the decimal separator.
    expect(formatCurrency(1250, 'EUR', 'DE')).toContain('1.250,00');
  });

  it('renders the currency symbol implied by the ISO code, not a hardcoded table', () => {
    expect(formatCurrency(100, 'PHP', 'PH')).toContain('₱');
    expect(formatCurrency(100, 'GBP', 'GB')).toContain('£');
  });

  it('falls back to a USD-shaped format for a malformed currency code instead of throwing', () => {
    expect(() => formatCurrency(100, 'NOT-A-CODE')).not.toThrow();
    expect(formatCurrency(100, 'NOT-A-CODE')).toBe('$100.00');
  });

  it('defaults to USD when no currency is provided', () => {
    expect(formatCurrency(50)).toBe('$50.00');
  });
});
