import { Component, Input } from '@angular/core';

/**
 * Single text-line placeholder (TASK-041) — the smallest skeleton primitive;
 * app-skeleton-row and app-skeleton-card are built out of these.
 */
@Component({
  selector: 'app-skeleton-line',
  templateUrl: './skeleton-line.component.html',
  styleUrls: ['./skeleton-line.component.scss']
})
export class SkeletonLineComponent {
  @Input() width = '100%';
  @Input() height = '14px';
}
