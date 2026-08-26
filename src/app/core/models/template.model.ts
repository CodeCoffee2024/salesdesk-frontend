export type TemplateTargetType = 'QuotesAndInvoices' | 'QuotesOnly' | 'InvoicesOnly';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  targetType: TemplateTargetType;
  accentColor: string | null;
  isDefault: boolean;
  usageCount: number;
}

export interface CreateTemplateRequest {
  name: string;
  targetType: TemplateTargetType;
  description: string | null;
  accentColor: string | null;
}

export type UpdateTemplateRequest = CreateTemplateRequest;
