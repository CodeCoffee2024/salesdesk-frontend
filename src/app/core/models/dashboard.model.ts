export interface DashboardSummary {
  revenueThisYear: number;
  outstanding: number;
  quotePipeline: number;
  activeCustomers: number;
  /** ISO 4217 code every amount above has been normalized into — the workspace's own DefaultCurrency (TASK-029). */
  baseCurrency: string;
}
