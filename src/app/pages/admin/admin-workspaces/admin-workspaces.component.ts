import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { WorkspaceSummary } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-workspaces',
  templateUrl: './admin-workspaces.component.html',
  styleUrls: ['./admin-workspaces.component.scss']
})
export class AdminWorkspacesComponent implements OnInit {
  workspaces: WorkspaceSummary[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';

  quotaDraft: Record<string, string> = {};
  savingId: string | null = null;
  workspacePendingSuspend: WorkspaceSummary | null = null;

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.adminService.getWorkspaces(this.searchTerm || undefined).subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
        this.quotaDraft = {};
        for (const workspace of workspaces) {
          this.quotaDraft[workspace.id] = workspace.documentQuota === null ? '' : String(workspace.documentQuota);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  search(): void {
    this.load();
  }

  onQuotaInput(workspaceId: string, event: Event): void {
    this.quotaDraft[workspaceId] = (event.target as HTMLInputElement).value;
  }

  activate(workspace: WorkspaceSummary): void {
    this.savingId = workspace.id;
    this.adminService.setWorkspaceStatus(workspace.id, true).subscribe({
      next: (updated) => this.applyUpdate(updated),
      error: () => (this.savingId = null)
    });
  }

  confirmSuspend(workspace: WorkspaceSummary): void {
    this.workspacePendingSuspend = workspace;
  }

  cancelSuspend(): void {
    this.workspacePendingSuspend = null;
  }

  suspend(): void {
    const workspace = this.workspacePendingSuspend;
    if (!workspace) {
      return;
    }

    this.workspacePendingSuspend = null;
    this.savingId = workspace.id;
    this.adminService.setWorkspaceStatus(workspace.id, false).subscribe({
      next: (updated) => this.applyUpdate(updated),
      error: () => (this.savingId = null)
    });
  }

  saveQuota(workspace: WorkspaceSummary): void {
    const raw = (this.quotaDraft[workspace.id] ?? '').trim();
    const quota = raw === '' ? null : Number(raw);
    if (quota !== null && (!Number.isFinite(quota) || quota < 0)) {
      return;
    }

    this.savingId = workspace.id;
    this.adminService.setWorkspaceQuota(workspace.id, quota).subscribe({
      next: (updated) => this.applyUpdate(updated),
      error: () => (this.savingId = null)
    });
  }

  private applyUpdate(updated: WorkspaceSummary): void {
    this.workspaces = this.workspaces.map((workspace) => (workspace.id === updated.id ? updated : workspace));
    this.quotaDraft[updated.id] = updated.documentQuota === null ? '' : String(updated.documentQuota);
    this.savingId = null;
  }
}
