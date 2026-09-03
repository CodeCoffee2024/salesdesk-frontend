import { Component, Input } from '@angular/core';
import { DocumentActivity, DocumentActivityType } from '../../core/models/document.model';

interface TimelineEntry {
  icon: string;
  label: string;
  detail: string | null;
  occurredAtUtc: string;
}

/**
 * Renders a document's activity history as a vertical timeline — "what
 * happened and when," the same underlying data shown two different ways:
 * third-person on the authenticated document preview (the workspace watching
 * a client's actions), second-person on the public /view/:token page (a
 * client watching their own actions plus the studio's). `perspective` picks
 * which set of labels applies; the icon and ordering stay the same either way.
 */
@Component({
  selector: 'app-document-timeline',
  templateUrl: './document-timeline.component.html',
  styleUrls: ['./document-timeline.component.scss']
})
export class DocumentTimelineComponent {
  @Input() activities: DocumentActivity[] = [];
  @Input() perspective: 'business' | 'client' = 'business';

  get entries(): TimelineEntry[] {
    return this.activities.map((activity) => ({
      icon: this.iconFor(activity.type),
      label: this.labelFor(activity.type),
      detail: this.detailFor(activity),
      occurredAtUtc: activity.occurredAtUtc
    }));
  }

  private iconFor(type: DocumentActivityType): string {
    switch (type) {
      case 'Created':
        return 'bi-file-earmark-plus';
      case 'Dispatched':
        return 'bi-send';
      case 'Viewed':
        return 'bi-eye';
      case 'RevisionRequested':
        return 'bi-pencil-square';
      case 'Edited':
        return 'bi-pencil';
      case 'Signed':
        return 'bi-check-circle-fill';
      case 'StatusChanged':
        return 'bi-arrow-repeat';
      case 'ReminderSent':
        return 'bi-bell';
      default:
        return 'bi-dot';
    }
  }

  private labelFor(type: DocumentActivityType): string {
    const isClient = this.perspective === 'client';

    switch (type) {
      case 'Created':
        return 'Document created';
      case 'Dispatched':
        return isClient ? 'Sent to you' : 'Sent to the client';
      case 'Viewed':
        return isClient ? 'You viewed this' : 'Client viewed the document';
      case 'RevisionRequested':
        return isClient ? 'You requested changes' : 'Client requested changes';
      case 'Edited':
        return isClient ? 'Updated by the studio' : 'Document details updated';
      case 'Signed':
        return isClient ? 'You signed this' : 'Signed by the client';
      case 'StatusChanged':
        return isClient ? 'Status updated' : 'Status changed';
      case 'ReminderSent':
        return 'Reminder email sent';
      default:
        return type;
    }
  }

  /** Detail line under the label — the client's own feedback text, the signer's name, the new status, etc. Prettified from PascalCase where the raw value is an enum name rather than free text. */
  private detailFor(activity: DocumentActivity): string | null {
    if (!activity.detail) {
      return null;
    }

    if (activity.type === 'RevisionRequested') {
      return `"${activity.detail}"`;
    }

    if (activity.type === 'Signed') {
      return this.perspective === 'client' ? null : `by ${activity.detail}`;
    }

    if (activity.type === 'StatusChanged' || activity.type === 'ReminderSent' || activity.type === 'Created') {
      return this.prettify(activity.detail);
    }

    return activity.detail;
  }

  /** "InvoiceOverdueFirstNotice" -> "Invoice Overdue First Notice" — a generic fallback so a new enum value never needs a matching display-string update here. */
  private prettify(value: string): string {
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
}
