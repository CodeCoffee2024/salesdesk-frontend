import { MOCK_MERGE_VALUES, resolveMergeTags } from './merge-tags';

describe('resolveMergeTags', () => {
  it('replaces a recognized token with its value', () => {
    const result = resolveMergeTags('<p>Hi {{Customer.Name}}</p>', { 'Customer.Name': 'Jordan Blake' });

    expect(result).toBe('<p>Hi Jordan Blake</p>');
  });

  it('replaces multiple distinct tokens in one pass', () => {
    const result = resolveMergeTags(
      '{{Customer.Name}} owes {{Document.Total}}',
      { 'Customer.Name': 'Jordan Blake', 'Document.Total': '$4,250.00' }
    );

    expect(result).toBe('Jordan Blake owes $4,250.00');
  });

  it('preserves surrounding HTML formatting untouched', () => {
    const result = resolveMergeTags('<h2><strong>{{Customer.Name}}</strong></h2>', { 'Customer.Name': 'Jordan Blake' });

    expect(result).toBe('<h2><strong>Jordan Blake</strong></h2>');
  });

  // Guardrail (TASK-022): an unresolved/unknown tag must never survive as raw
  // {{...}} in what's presented as final output — it blanks instead of leaking.
  it('blanks an unrecognized token rather than leaving the raw tag', () => {
    const result = resolveMergeTags('<p>{{Nonsense.Token}}</p>', MOCK_MERGE_VALUES);

    expect(result).toBe('<p></p>');
    expect(result).not.toContain('{{');
    expect(result).not.toContain('}}');
  });

  it('leaves plain text with no tags unchanged', () => {
    const result = resolveMergeTags('<p>No tags here.</p>', MOCK_MERGE_VALUES);

    expect(result).toBe('<p>No tags here.</p>');
  });

  it('never leaves a raw tag when resolving against the full mock value set', () => {
    const source = '<p>{{Customer.Name}} / {{Customer.Email}} / {{Customer.Company}} / '
      + '{{Document.Number}} / {{Document.IssueDate}} / {{Document.DueDate}} / {{Document.Total}}</p>';

    const result = resolveMergeTags(source, MOCK_MERGE_VALUES);

    expect(result).not.toContain('{{');
    expect(result).not.toContain('}}');
  });
});
