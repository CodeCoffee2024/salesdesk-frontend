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
