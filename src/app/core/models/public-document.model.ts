import { DocumentActivity, DocumentLineItem, DocumentStatus, DocumentType } from './document.model';

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
  /** ISO 4217 code the portal formats amounts in via Intl.NumberFormat (TASK-029). */
  currency: string;
  /** Optional ISO 3166-1 alpha-2 target country used to pick the display locale alongside currency (TASK-029). */
  clientCountry: string | null;
  lineItems: DocumentLineItem[];
  isSigned: boolean;
  signedByName: string | null;
  signedAtUtc: string | null;
  signatureImageDataUrl: string | null;
  /** The client-facing slice of the document's history, oldest first — excludes internal-only entries (drafting, reminder-log noise). */
  timeline: DocumentActivity[];
  /** Whether this invoice has actually been paid online via Pay Now (TASK-042) — independent of status, which a workspace can also set to 'Paid' manually. */
  paymentStatus: 'Unpaid' | 'Paid';
  paidAmount: number | null;
  paidAtUtc: string | null;
}

export type SignatureType = 'Drawn' | 'Typed';

export interface SignDocumentRequest {
  signerName: string;
  signerEmail: string;
  agreedToTerms: boolean;
  signatureType: SignatureType;
  signatureImageDataUrl: string;
}

/** A hosted Stripe Checkout page to redirect the browser to (TASK-042) — the caller never handles card details itself. */
export interface CheckoutSession {
  checkoutUrl: string;
}
