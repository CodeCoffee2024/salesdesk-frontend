export interface PlatformMetrics {
  totalWorkspaces: number;
  totalActiveWorkspaces: number;
  totalUsers: number;
  totalIssuedDocuments: number;
  /** Real quota utilization (documents issued vs. combined active quota) — there's no
   *  billing system in this app, so this stands in for "Platform MRR" honestly. Null
   *  when no active workspace has a quota configured. */
  documentQuotaUsagePercent: number | null;
  systemHealth: 'Healthy' | 'Unhealthy';
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  documentQuota: number | null;
  createdAt: string;
  userCount: number;
  documentCount: number;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  eventType: string;
  message: string;
  workspaceId: string | null;
  userId: string | null;
  occurredAtUtc: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
