import { formatDateOnly } from './date.util';

describe('formatDateOnly', () => {
  it('formats a date as local yyyy-MM-dd', () => {
    expect(formatDateOnly(new Date(2026, 7, 5))).toBe('2026-08-05');
  });

  it('zero-pads single-digit months and days', () => {
    expect(formatDateOnly(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('handles the last day of December correctly', () => {
    expect(formatDateOnly(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});
