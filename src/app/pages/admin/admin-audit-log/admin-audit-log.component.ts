import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AuditLogEntry } from '../../../core/models/admin.model';

const PAGE_SIZE = 25;

@Component({
  selector: 'app-admin-audit-log',
  templateUrl: './admin-audit-log.component.html',
  styleUrls: ['./admin-audit-log.component.scss']
})
export class AdminAuditLogComponent implements OnInit {
  entries: AuditLogEntry[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';
  page = 1;
  totalCount = 0;
  readonly pageSize = PAGE_SIZE;

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.adminService.getAuditLog(this.searchTerm || undefined, this.page, this.pageSize).subscribe({
      next: (result) => {
        this.entries = result.items;
        this.totalCount = result.totalCount;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  search(): void {
    this.page = 1;
    this.load();
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.load();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      this.load();
    }
  }
}
