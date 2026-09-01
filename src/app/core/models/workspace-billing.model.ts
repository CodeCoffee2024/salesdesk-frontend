/** TASK-031: mirrors the backend's WorkspaceBillingDto (GET /api/workspace/billing). */
export type SubscriptionTier = 'Free' | 'Premium';

export interface WorkspaceBilling {
  subscriptionTier: SubscriptionTier;
  /** ISO 8601 timestamp, or null for a Free workspace. */
  subscriptionEndDate: string | null;
  /** True if this workspace was one of the first 100 eligible registrations. */
  isEarlyBirdPromo: boolean;
}
