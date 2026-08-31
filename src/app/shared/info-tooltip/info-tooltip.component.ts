import { Component, Input } from '@angular/core';

/**
 * Small "(i)" glyph placed next to a non-obvious control (TASK-029) — e.g. merge
 * tags in the template editor. Shows its explanation on hover (desktop) or tap
 * (touch, via a click-toggle fallback, since there's no hover state to rely on there).
 */
@Component({
  selector: 'app-info-tooltip',
  templateUrl: './info-tooltip.component.html',
  styleUrls: ['./info-tooltip.component.scss']
})
export class InfoTooltipComponent {
  @Input() text = '';

  open = false;

  toggle(): void {
    this.open = !this.open;
  }

  close(): void {
    this.open = false;
  }
}
