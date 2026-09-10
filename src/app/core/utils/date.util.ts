/**
 * Formats a Date as a local yyyy-MM-dd string, suitable for a native
 * `<input type="date">` value or a `from`/`to` query parameter. Deliberately
 * not `date.toISOString()`, which is UTC-based and can roll the date backward
 * for any local timezone ahead of UTC (e.g. a report page loaded at 1am in
 * Manila would report "yesterday" as today's date).
 */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
