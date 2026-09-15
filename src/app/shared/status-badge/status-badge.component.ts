import { Component, Input } from '@angular/core';
import { DocumentStatus } from '../../core/models/document.model';

const FRIENDLY_LABELS: Partial<Record<DocumentStatus, string>> = {
  RevisionRequested: 'Revision requested'
};

/** TASK-041: what each status actually means, for a hover/long-press tooltip on the badge — color/label alone don't say e.g. what distinguishes "Revision requested" from "Sent". */
const EXPLANATIONS: Record<DocumentStatus, string> = {
  Draft: 'Not yet sent to the client.',
  Sent: 'Delivered to the client, awaiting a response.',
  Overdue: "Past its due date and still hasn't been paid.",
  Accepted: 'The client accepted this quote.',
  Paid: 'Payment has been received in full.',
  RevisionRequested: 'The client asked for changes before proceeding.'
};

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  // Angular 15 predates the `@Input({ required: true })` API — the `!` here just
  // tells TypeScript this is always set by the parent template's binding.
  @Input() status!: DocumentStatus;

  get label(): string {
    return FRIENDLY_LABELS[this.status] ?? this.status;
  }

  get explanation(): string {
    return EXPLANATIONS[this.status] ?? '';
  }
}
