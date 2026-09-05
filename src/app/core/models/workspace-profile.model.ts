export interface WorkspaceProfile {
  name: string;
  email: string;
  tagline: string | null;
  address: string | null;
  logoUrl: string | null;
  /** ISO 3166-1 alpha-2 operating country (TASK-029). */
  country: string;
  /** ISO 4217 default currency new documents are priced in unless overridden (TASK-029). */
  defaultCurrency: string;
  /** IANA time zone id document/reminder email timestamps are localized into instead of raw UTC. */
  timeZoneId: string;
}

export type UpdateWorkspaceProfileRequest = WorkspaceProfile;
