/** A workspace's automated reminder engine configuration (TASK-025). */
export interface ReminderSettings {
  isEnabled: boolean;
  quoteFollowUpEnabled: boolean;
  invoiceDueWarningEnabled: boolean;
  overdueNoticesEnabled: boolean;
  ccEmail: string | null;
}

export type SaveReminderSettingsRequest = ReminderSettings;
