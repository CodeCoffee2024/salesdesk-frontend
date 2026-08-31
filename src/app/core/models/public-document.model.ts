import { DocumentLineItem, DocumentStatus, DocumentType } from './document.model';

/** What the anonymous /view/:token page renders — a deliberately narrower shape than Document (no internal ids). */
export interface PublicDocument {
  documentNumber: string;
  type: DocumentType;
  status: DocumentStatus;
  issueDate: string;
  dueDate: string;
  customerName: string;
  customerCompany: string;
  workspaceName: string;
  workspaceLogoUrl: string | null;
  subtotal: number;
  total: number;
  lineItems: DocumentLineItem[];
  isSigned: boolean;
  signedByName: string | null;
  signedAtUtc: string | null;
}

export type SignatureType = 'Drawn' | 'Typed';

export interface SignDocumentRequest {
  signerName: string;
  signerEmail: string;
  agreedToTerms: boolean;
  signatureType: SignatureType;
  signatureImageDataUrl: string;
}
