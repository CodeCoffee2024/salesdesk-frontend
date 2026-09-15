import { Component, Input } from '@angular/core';

/**
 * Card-shaped placeholder (TASK-041) — a title line plus `lines` body lines,
 * boxed like the customer/product/template cards and dashboard KPI tiles it
 * stands in for.
 */
@Component({
  selector: 'app-skeleton-card',
  templateUrl: './skeleton-card.component.html',
  styleUrls: ['./skeleton-card.component.scss']
})
export class SkeletonCardComponent {
  @Input() lines = 2;

  get lineIndexes(): number[] {
    return Array.from({ length: this.lines }, (_, i) => i);
  }
}
