/** TASK-031/TASK-038: mirrors the backend's WorkspaceBillingDto (GET /api/workspace/billing). */
export type SubscriptionTier = 'Free' | 'Pro' | 'Studio';

export interface WorkspaceBilling {
  subscriptionTier: SubscriptionTier;
  /** ISO 8601 timestamp, or null for a Free workspace. */
  subscriptionEndDate: string | null;
  /** True if this workspace was one of the first 100 eligible registrations. */
  isEarlyBirdPromo: boolean;
  /** This tier's monthly document cap, or null when unlimited (Pro/Studio). */
  monthlyDocumentLimit: number | null;
  /** Documents issued so far this calendar month. */
  documentsIssuedThisMonth: number;
  /** TASK-039: set while a GCash payment claim is awaiting admin verification. Null once approved, or if nothing's ever been submitted. */
  pendingGCashSubmission: PendingGCashSubmission | null;
}

export interface PendingGCashSubmission {
  gCashReferenceNumber: string;
  tier: SubscriptionTier;
  submittedAtUtc: string;
}

/** TASK-038: mirrors the backend's PricingTierDto/PricingCatalogDto (GET /api/workspace/billing/pricing). */
export interface PricingTier {
  tier: SubscriptionTier;
  displayName: string;
  currency: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyDocumentLimit: number | null;
  maxUsers: number | null;
  features: string[];
}

export interface PricingCatalog {
  region: string;
  currency: string;
  tiers: PricingTier[];
}

export type BillingCycle = 'Monthly' | 'Annual';

export interface CheckoutSession {
  checkoutUrl: string;
  providerReference: string;
}

/** TASK-039: mirrors the backend's GCashPaymentDetailsDto (GET /api/workspace/billing/gcash-details). */
export interface GCashPaymentDetails {
  accountName: string | null;
  mobileNumber: string | null;
  qrCodeUrl: string | null;
  tiers: PricingTier[];
}

export interface SubmitGCashPaymentRequest {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  gCashReferenceNumber: string;
  senderName: string;
  senderMobileNumber: string;
  screenshotDataUrl: string | null;
}

export interface GCashSubmissionConfirmation {
  gCashReferenceNumber: string;
  submittedAtUtc: string;
}
