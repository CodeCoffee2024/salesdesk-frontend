import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUser } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';

  /** Set when arriving via a deep link from a workspace directory row
   *  (/admin/users?workspaceId=...) — narrows the directory to that tenant. */
  workspaceId: string | null = null;
  workspaceName: string | null = null;

  impersonatingId: string | null = null;
  impersonateError: string | null = null;

  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.queryParamMap.get('workspaceId');
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.adminService.getUsers(this.searchTerm || undefined, this.workspaceId || undefined).subscribe({
      next: (users) => {
        this.users = users;
        this.workspaceName = this.workspaceId ? (users[0]?.workspaceName ?? this.workspaceName) : null;
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

  clearWorkspaceFilter(): void {
    this.workspaceId = null;
    this.workspaceName = null;
    this.router.navigate(['/admin/users']);
    this.load();
  }

  filterToWorkspace(user: AdminUser): void {
    this.workspaceId = user.workspaceId;
    this.workspaceName = user.workspaceName;
    this.router.navigate(['/admin/users'], { queryParams: { workspaceId: user.workspaceId } });
    this.load();
  }

  impersonate(user: AdminUser): void {
    this.impersonateError = null;
    this.impersonatingId = user.id;

    this.adminService.impersonate(user.id).subscribe({
      next: (response) => {
        this.authService.beginImpersonation(response);
        this.impersonatingId = null;
        this.router.navigate(['/overview']);
      },
      error: () => {
        this.impersonatingId = null;
        this.impersonateError = `Couldn't start a session as ${user.email}. Try again.`;
      }
    });
  }
}
