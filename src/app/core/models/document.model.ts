export type DocumentType = 'Quote' | 'Invoice';

export type DocumentStatus = 'Draft' | 'Sent' | 'Overdue' | 'Accepted' | 'Paid';

export interface DocumentLineItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Document {
  id: string;
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
}

export interface UpdateDocumentRequest {
  templateId: string;
  dueDate: string;
  status: DocumentStatus;
  lineItems: CreateDocumentLineItemRequest[];
}
