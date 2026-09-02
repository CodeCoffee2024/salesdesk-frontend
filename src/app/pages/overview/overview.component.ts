import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { DocumentService } from '../../core/services/document.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { Document as DocumentModel } from '../../core/models/document.model';

interface MonthlyRevenuePoint {
  label: string;
  amount: number;
}

const MONTHS_TO_SHOW = 6;
const RECENT_DOCUMENTS_TO_SHOW = 5;

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnInit {
  loading = true;
  loadError = false;

  summary: DashboardSummary | null = null;
  recentDocuments: DocumentModel[] = [];
  monthlyRevenue: MonthlyRevenuePoint[] = [];

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly documentService: DocumentService
  ) {}

  ngOnInit(): void {
    forkJoin({
      summary: this.dashboardService.getSummary(),
      // Fetched unfiltered (server already orders newest-first) so one call can
      // drive both the "recent documents" list and the revenue chart below.
      documents: this.documentService.getAll()
    }).subscribe({
      next: ({ summary, documents }) => {
        this.summary = summary;
        this.recentDocuments = documents.slice(0, RECENT_DOCUMENTS_TO_SHOW);
        this.monthlyRevenue = this.computeMonthlyRevenue(documents);
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }

  get maxMonthlyRevenue(): number {
    return Math.max(1, ...this.monthlyRevenue.map((point) => point.amount));
  }

  get nextBestActionMessage(): string {
    const pipeline = this.summary?.quotePipeline ?? 0;
    return pipeline > 0
      ? 'Turn a warm quote into a yes.'
      : "You're all caught up. No quotes waiting on a decision.";
  }

  private computeMonthlyRevenue(documents: DocumentModel[]): MonthlyRevenuePoint[] {
    const now = new Date();
    const buckets = Array.from({ length: MONTHS_TO_SHOW }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (MONTHS_TO_SHOW - 1 - index), 1);
      return {
        key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
        label: monthDate.toLocaleString('en-US', { month: 'short' }),
        amount: 0
      };
    });

    const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    documents
      .filter((document) => document.type === 'Invoice' && document.status === 'Paid')
      .forEach((document) => {
        const issued = new Date(document.issueDate);
        const key = `${issued.getFullYear()}-${issued.getMonth()}`;
        const bucket = bucketByKey.get(key);
        if (bucket) {
          bucket.amount += document.total;
        }
      });

    return buckets.map(({ label, amount }) => ({ label, amount }));
  }
}
