import { Component, Input } from '@angular/core';

/**
 * Repeats app-skeleton-row or app-skeleton-card `count` times (TASK-041) — the
 * one-line way most list/grid screens adopt the skeleton primitives, e.g.
 * `<app-skeleton-list [count]="6" type="card"></app-skeleton-list>` for a
 * customer/product/template grid, or the default row type for a table.
 */
@Component({
  selector: 'app-skeleton-list',
  templateUrl: './skeleton-list.component.html',
  styleUrls: ['./skeleton-list.component.scss']
})
export class SkeletonListComponent {
  @Input() type: 'row' | 'card' = 'row';
  @Input() count = 5;
  @Input() columns = 4;
  @Input() widths?: string[];
  @Input() lines = 2;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
