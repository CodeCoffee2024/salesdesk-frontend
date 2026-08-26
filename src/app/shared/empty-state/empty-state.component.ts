import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  /** Which glyph to show — kept to a small fixed set rather than an arbitrary icon input. */
  @Input() icon: 'not-found' | 'document' = 'not-found';
  @Input() heading = 'Not found';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionLink = '/';
}
