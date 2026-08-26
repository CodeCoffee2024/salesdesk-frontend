import { Component, Input } from '@angular/core';
import { DocumentStatus } from '../../core/models/document.model';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  // Angular 15 predates the `@Input({ required: true })` API — the `!` here just
  // tells TypeScript this is always set by the parent template's binding.
  @Input() status!: DocumentStatus;
}
