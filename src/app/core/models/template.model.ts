export type TemplateTargetType = 'QuotesAndInvoices' | 'QuotesOnly' | 'InvoicesOnly';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  targetType: TemplateTargetType;
  accentColor: string | null;
  /** Rich-text body authored in the template editor (TASK-022): HTML containing
   *  inline formatting plus unresolved `{{Customer.Name}}`-style merge tags. */
  contentHtml: string | null;
  isDefault: boolean;
  usageCount: number;
}

export interface CreateTemplateRequest {
  name: string;
  targetType: TemplateTargetType;
  description: string | null;
  accentColor: string | null;
  contentHtml?: string | null;
}

export type UpdateTemplateRequest = CreateTemplateRequest;
