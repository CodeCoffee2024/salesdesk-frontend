/** TASK-033: what the backend's AI text parser extracted from a pasted message, plus what it auto-provisioned/couldn't resolve. Mirrors ParsedQuoteResultDto. */
export interface ParsedQuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ParsedQuoteResult {
  /** '00000000-0000-0000-0000-000000000000' when no customer could be resolved or created (the text had no usable email) — the document form leaves the customer picker for the user in that case. */
  customerId: string;
  customerCreated: boolean;
  customerName: string;
  lineItems: ParsedQuoteLineItem[];
  suggestedDepositPercentage: number | null;
  suggestedValidityDays: number | null;
  /** Plain-language field names the parser couldn't find in the text, e.g. "customer email", for the frontend to flag next to the pre-filled form rather than leaving them silently blank. */
  unresolvedFields: string[];
}

export const EMPTY_CUSTOMER_ID = '00000000-0000-0000-0000-000000000000';
