import { Component, Input } from '@angular/core';

/**
 * Bar-chart-shaped placeholder (TASK-041) — stands in for the dashboard's
 * revenue pulse chart while its data loads. Bar heights are fixed (not
 * randomized) so the shimmer doesn't jitter between change-detection passes.
 */
@Component({
  selector: 'app-skeleton-chart',
  templateUrl: './skeleton-chart.component.html',
  styleUrls: ['./skeleton-chart.component.scss']
})
export class SkeletonChartComponent {
  @Input() bars = 6;

  private static readonly HEIGHT_PATTERN = [55, 80, 40, 95, 65, 45, 75, 60];

  get barHeights(): number[] {
    return Array.from({ length: this.bars }, (_, i) => SkeletonChartComponent.HEIGHT_PATTERN[i % SkeletonChartComponent.HEIGHT_PATTERN.length]);
  }
}
