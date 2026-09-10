import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ReportsService } from '../../core/services/reports.service';
import { RevenueReport, TopCustomer, TopProduct } from '../../core/models/report.model';
import { formatDateOnly } from '../../core/utils/date.util';

type PresetKey = 'this-month' | 'last-month' | 'last-3-months' | 'last-12-months' | 'custom';

interface Preset {
  key: PresetKey;
  label: string;
}

const PRESETS: Preset[] = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'last-3-months', label: 'Last 3 months' },
  { key: 'last-12-months', label: 'Last 12 months' }
];

/**
 * Reports & Analytics dashboard (TASK-043) — a date-ranged view answering "how
 * much did I invoice," "who owes me money," and "what's my best-selling item,"
 * over a shared filter that scopes every chart/stat/table on the page equally.
 */
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  readonly presets = PRESETS;
  activePreset: PresetKey = 'this-month';
  fromInput = '';
  toInput = '';

  loading = true;
  loadError = false;
  hasLoadedOnce = false;

  revenue: RevenueReport | null = null;
  topCustomers: TopCustomer[] = [];
  topProducts: TopProduct[] = [];

  constructor(private readonly reportsService: ReportsService) {}

  ngOnInit(): void {
    this.applyPreset('this-month');
  }

  get maxRevenue(): number {
    return Math.max(1, ...(this.revenue?.points.map((point) => point.amount) ?? []));
  }

  get isEmptyRange(): boolean {
    return (
      this.hasLoadedOnce &&
      !this.loading &&
      !this.loadError &&
      (this.revenue?.points.every((point) => point.amount === 0) ?? true) &&
      (this.revenue?.outstanding ?? 0) === 0 &&
      this.topCustomers.length === 0 &&
      this.topProducts.length === 0
    );
  }

  applyPreset(key: PresetKey): void {
    this.activePreset = key;
    const { from, to } = this.rangeForPreset(key);
    this.fromInput = from;
    this.toInput = to;
    this.fetch();
  }

  onDateInputChanged(): void {
    this.activePreset = 'custom';
    if (this.fromInput && this.toInput) {
      this.fetch();
    }
  }

  private rangeForPreset(key: PresetKey): { from: string; to: string } {
    const now = new Date();
    const startOfMonth = (offset: number) => new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const endOfMonth = (offset: number) => new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);

    switch (key) {
      case 'last-month':
        return { from: formatDateOnly(startOfMonth(-1)), to: formatDateOnly(endOfMonth(-1)) };
      case 'last-3-months':
        return { from: formatDateOnly(startOfMonth(-2)), to: formatDateOnly(now) };
      case 'last-12-months':
        return { from: formatDateOnly(startOfMonth(-11)), to: formatDateOnly(now) };
      case 'this-month':
      default:
        return { from: formatDateOnly(startOfMonth(0)), to: formatDateOnly(now) };
    }
  }

  private fetch(): void {
    this.loading = true;
    this.loadError = false;

    forkJoin({
      revenue: this.reportsService.getRevenue(this.fromInput, this.toInput),
      topCustomers: this.reportsService.getTopCustomers(this.fromInput, this.toInput),
      topProducts: this.reportsService.getTopProducts(this.fromInput, this.toInput)
    }).subscribe({
      next: ({ revenue, topCustomers, topProducts }) => {
        this.revenue = revenue;
        this.topCustomers = topCustomers;
        this.topProducts = topProducts;
        this.loading = false;
        this.hasLoadedOnce = true;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }
}
