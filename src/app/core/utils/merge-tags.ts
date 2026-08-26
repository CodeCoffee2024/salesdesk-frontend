/**
 * Merge-tag support for the template editor (TASK-022): the tokens an author can
 * insert into a template's rich-text body, and the resolver that compiles them down
 * to static text.
 *
 * Guardrail: a template's stored contentHtml is a *source*, not a client-facing
 * render — it's expected to contain raw `{{Customer.Name}}`-style tags. Nothing
 * that represents a live preview, export, or delivered document may ever show a
 * raw tag, so resolveMergeTags() replaces every `{{...}}` occurrence unconditionally
 * — a recognized token becomes its value, anything else (typos, tokens that don't
 * exist) becomes an empty string, never literal curly braces.
 */

export interface MergeTokenDefinition {
  token: string;
  label: string;
  group: 'Customer' | 'Document';
}

export const MERGE_TOKENS: MergeTokenDefinition[] = [
  { token: 'Customer.Name', label: 'Customer name', group: 'Customer' },
  { token: 'Customer.Email', label: 'Customer email', group: 'Customer' },
  { token: 'Customer.Company', label: 'Customer company', group: 'Customer' },
  { token: 'Document.Number', label: 'Document number', group: 'Document' },
  { token: 'Document.IssueDate', label: 'Issue date', group: 'Document' },
  { token: 'Document.DueDate', label: 'Due date', group: 'Document' },
  { token: 'Document.Total', label: 'Total', group: 'Document' }
];

/** Sample values the live preview substitutes while a template is being designed,
 *  standing in for a real customer/document until this template is actually
 *  applied to one. */
export const MOCK_MERGE_VALUES: Record<string, string> = {
  'Customer.Name': 'Jordan Blake',
  'Customer.Email': 'jordan@northstar.studio',
  'Customer.Company': 'Northstar Studio',
  'Document.Number': 'INV-2026-014',
  'Document.IssueDate': 'Aug 12, 2026',
  'Document.DueDate': 'Sep 11, 2026',
  'Document.Total': '$4,250.00'
};

const MERGE_TAG_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

/**
 * Replaces every `{{Token}}` occurrence in `html` with its value from `values`.
 * An unrecognized token resolves to an empty string rather than being left in
 * place — the output never contains a literal `{{`/`}}` pair.
 */
export function resolveMergeTags(html: string, values: Record<string, string>): string {
  return html.replace(MERGE_TAG_PATTERN, (_match, token: string) => values[token] ?? '');
}
