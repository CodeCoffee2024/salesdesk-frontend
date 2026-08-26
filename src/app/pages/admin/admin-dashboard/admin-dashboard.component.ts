import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { PlatformMetrics } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  metrics: PlatformMetrics | null = null;
  loading = true;
  loadError = false;

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getMetrics().subscribe({
      next: (metrics) => {
        this.metrics = metrics;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }
}
