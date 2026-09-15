import { Component, Input } from '@angular/core';

/**
 * One table-row-shaped placeholder (TASK-041) — matches the documents/recent-
 * activity table shape: a wider first "identity" cell followed by `columns - 1`
 * narrower cells. Pass `widths` to override individual cell widths when the
 * real columns are noticeably uneven.
 */
@Component({
  selector: 'app-skeleton-row',
  templateUrl: './skeleton-row.component.html',
  styleUrls: ['./skeleton-row.component.scss']
})
export class SkeletonRowComponent {
  @Input() columns = 4;
  @Input() widths?: string[];

  widthFor(index: number): string {
    if (this.widths?.[index]) {
      return this.widths[index];
    }
    return index === 0 ? '60%' : '80%';
  }

  get columnIndexes(): number[] {
    return Array.from({ length: this.columns }, (_, i) => i);
  }
}
