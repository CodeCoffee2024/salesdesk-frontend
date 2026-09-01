import { CurrencyLocalePipe } from './currency-locale.pipe';

describe('CurrencyLocalePipe', () => {
  let pipe: CurrencyLocalePipe;

  beforeEach(() => {
    pipe = new CurrencyLocalePipe();
  });

  it('formats a value using the given currency and country', () => {
    expect(pipe.transform(1250, 'EUR', 'DE')).toContain('1.250,00');
  });

  it('defaults to USD when no currency is provided', () => {
    expect(pipe.transform(50)).toBe('$50.00');
  });

  it('returns an empty string for null or undefined values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns an empty string for NaN', () => {
    expect(pipe.transform(NaN)).toBe('');
  });
});
