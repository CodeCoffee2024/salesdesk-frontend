export type DocumentType = 'Quote' | 'Invoice';

export type DocumentStatus = 'Draft' | 'Sent' | 'Overdue' | 'Accepted' | 'Paid' | 'RevisionRequested';

export interface DocumentLineItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DocumentSignatureSummary {
  signerName: string;
  signerEmail: string;
  signedAtUtc: string;
  signatureImageDataUrl: string;
}

export interface Document {
  id: string;
  publicToken: string;
  isLocked: boolean;
  /** True once this document has ever been sent to the client (TASK-037) — stays true even after status later moves on. */
  isDispatched: boolean;
  dispatchedAt: string | null;
  signature: DocumentSignatureSummary | null;
  documentNumber: string;
  type: DocumentType;
  status: DocumentStatus;
  issueDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  templateId: string;
  templateName: string;
  subtotal: number;
  total: number;
  /** ISO 4217 code this document is priced in (TASK-029). */
  currency: string;
  /** Optional ISO 3166-1 alpha-2 override of the client's target country (TASK-029). */
  clientCountry: string | null;
  lineItems: DocumentLineItem[];
}

export interface DocumentListFilters {
  type?: 'all' | 'quote' | 'invoice';
  status?: DocumentStatus;
  search?: string;
}

export interface CreateDocumentLineItemRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  productId: string | null;
}

export interface CreateDocumentRequest {
  type: DocumentType;
  customerId: string;
  templateId: string;
  dueDate: string;
  lineItems: CreateDocumentLineItemRequest[];
  /** ISO 4217 override — omit/null to default from the workspace/customer (TASK-029). */
  currency?: string | null;
  /** ISO 3166-1 alpha-2 override — omit/null to default from the customer/workspace (TASK-029). */
  clientCountry?: string | null;
  /** TASK-037 "Save & Send to Client" — true dispatches immediately instead of saving a Draft. */
  dispatch?: boolean;
}

export interface UpdateDocumentRequest {
  templateId: string;
  dueDate: string;
  lineItems: CreateDocumentLineItemRequest[];
  /** ISO 4217 override — omit/null to leave the document's currency unchanged (TASK-029). */
  currency?: string | null;
  /** ISO 3166-1 alpha-2 override — omit/null to leave unchanged (TASK-029). */
  clientCountry?: string | null;
  /** TASK-037 "Save & Send to Client" / "Save & Re-Send Revision" — true dispatches (or re-dispatches) to Sent. */
  dispatch?: boolean;
}
