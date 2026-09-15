import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  @Input() heading = 'Are you sure?';
  @Input() message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() destructive = true;
  /** TASK-041: irreversible actions (e.g. a permanent delete) don't get an optimistic UI update — this disables the confirm button and swaps in confirmBusyLabel while the request is in flight, so there's still a clear pending state instead of one that just silently does nothing if double-clicked. */
  @Input() confirmDisabled = false;
  @Input() confirmBusyLabel = '';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
