import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { DocumentService } from '../../../core/services/document.service';
import { Document as DocumentModel, DocumentStatus } from '../../../core/models/document.model';
import { LocalCacheService } from '../../../core/services/local-cache.service';
import { staleWhileRevalidate } from '../../../core/utils/stale-while-revalidate.util';
import { documentsListCacheKey } from '../../../core/utils/document-cache-keys.util';

type DocumentTab = 'all' | 'quote' | 'invoice';

const SEARCH_DEBOUNCE_MS = 300;
const HIGHLIGHT_DURATION_MS = 4000;

/** Status changes cheap enough to reflect immediately and reconcile after the fact (TASK-041). "Paid" is deliberately excluded — a false-positive "payment received" is exactly the misleading optimistic update the guardrail rules out, so it keeps an explicit pending state instead. */
const OPTIMISTIC_STATUSES: ReadonlySet<DocumentStatus> = new Set<DocumentStatus>(['Draft', 'Sent', 'Overdue', 'Accepted', 'RevisionRequested']);

@Component({
  selector: 'app-documents-list',
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.scss']
})
export class DocumentsListComponent implements OnInit {
  readonly statusOptions: DocumentStatus[] = ['Draft', 'Sent', 'Overdue', 'Accepted', 'Paid', 'RevisionRequested'];

  documents: DocumentModel[] = [];
  loading = true;
  loadError = false;

  activeTab: DocumentTab = 'all';
  searchTerm = '';

  openMenuForId: string | null = null;
  statusMenuOpen = false;
  documentPendingDelete: DocumentModel | null = null;
  deletingDocument = false;

  /** Set while a status change is in flight for a non-optimistic status (currently just "Paid") — everything else updates the row immediately instead. */
  updatingStatusForId: string | null = null;
  /** Inline error surfaced when a status change/delete fails (TASK-041) — for an optimistic status change, this is shown alongside the row's rollback to its pre-optimistic status, explaining what didn't save. */
  actionError = '';

  /** The document a create/edit flow just navigated here from, briefly highlighted. */
  highlightedDocumentId: string | null = null;

  /** Set when the document-form couldn't reach the API and queued the create offline instead (TASK-027) — shown as a banner, not an error, since the work wasn't lost. */
  savedOffline = false;

  private readonly searchInput$ = new Subject<string>();

  constructor(
    private readonly documentService: DocumentService,
    private readonly router: Router,
    private readonly cache: LocalCacheService
  ) {
    // Only readable during construction of the component a navigation targets —
    // this is how the document-form's `{ state: { highlightId } }` extra arrives.
    const state = this.router.getCurrentNavigation()?.extras.state as
      | { highlightId?: string; savedOffline?: boolean }
      | undefined;
    this.highlightedDocumentId = state?.highlightId ?? null;
    this.savedOffline = state?.savedOffline ?? false;
  }

  ngOnInit(): void {
    this.searchInput$.pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged()).subscribe((term) => {
      this.searchTerm = term;
      this.loadDocuments();
    });

    this.loadDocuments();

    if (this.highlightedDocumentId) {
      setTimeout(() => (this.highlightedDocumentId = null), HIGHLIGHT_DURATION_MS);
    }

    if (this.savedOffline) {
      setTimeout(() => (this.savedOffline = false), HIGHLIGHT_DURATION_MS);
    }
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  setTab(tab: DocumentTab): void {
    if (tab === this.activeTab) {
      return;
    }
    this.activeTab = tab;
    this.loadDocuments();
  }

  toggleMenu(documentId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuForId = this.openMenuForId === documentId ? null : documentId;
    this.statusMenuOpen = false;
  }

  toggleStatusMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.statusMenuOpen = !this.statusMenuOpen;
  }

  preview(documentId: string): void {
    this.closeMenu();
    this.router.navigate(['/documents', documentId, 'preview']);
  }

  edit(documentId: string): void {
    this.closeMenu();
    this.router.navigate(['/documents', documentId, 'edit']);
  }

  /** TASK-037: once a document has been dispatched, its content is locked from direct edits — Draft (never sent) and RevisionRequested (client asked for changes) are the only editable states, matching Document.EnsureEditable on the backend. */
  canEdit(document: DocumentModel): boolean {
    return !document.isLocked && (document.status === 'Draft' || document.status === 'RevisionRequested');
  }

  editDisabledReason(document: DocumentModel): string {
    if (document.isLocked) {
      return 'Signed documents cannot be edited';
    }
    if (!this.canEdit(document)) {
      return 'Already sent to the client — request or create a revision to make changes';
    }
    return '';
  }

  /**
   * TASK-041: "Draft"/"Sent"/"Overdue"/"Accepted"/"Revision requested" are just
   * workflow labels — reversible, nothing to lose by showing the change before
   * the server confirms it, so the row updates immediately and only rolls back
   * (with an inline error) if the request actually fails. "Paid" is excluded —
   * see OPTIMISTIC_STATUSES — and keeps the previous wait-for-the-server
   * behavior with its own pending state instead.
   */
  changeStatus(document: DocumentModel, status: DocumentStatus): void {
    this.closeMenu();
    this.actionError = '';

    if (!OPTIMISTIC_STATUSES.has(status)) {
      this.updatingStatusForId = document.id;
      this.documentService.updateStatus(document.id, status).subscribe({
        next: (updated) => {
          this.updatingStatusForId = null;
          this.applyDocumentToList(updated);
        },
        error: () => {
          this.updatingStatusForId = null;
          this.actionError = 'Could not update the status. Please try again.';
        }
      });
      return;
    }

    const previousStatus = document.status;
    this.applyDocumentToList({ ...document, status });

    this.documentService.updateStatus(document.id, status).subscribe({
      next: (updated) => this.applyDocumentToList(updated),
      error: () => {
        this.applyDocumentToList({ ...document, status: previousStatus });
        const label = status === 'RevisionRequested' ? 'Revision requested' : status;
        this.actionError = `Could not change ${document.documentNumber} to "${label}". Please try again.`;
      }
    });
  }

  requestDelete(document: DocumentModel): void {
    this.documentPendingDelete = document;
    this.closeMenu();
  }

  /** Deletion is irreversible, so unlike changeStatus it waits for the server to confirm rather than optimistically removing the row (TASK-041 guardrail). */
  confirmDelete(): void {
    if (!this.documentPendingDelete) {
      return;
    }

    const id = this.documentPendingDelete.id;
    this.deletingDocument = true;

    this.documentService.delete(id).subscribe({
      next: () => {
        this.documents = this.documents.filter((d) => d.id !== id);
        this.documentPendingDelete = null;
        this.deletingDocument = false;
      },
      error: () => {
        this.deletingDocument = false;
        this.documentPendingDelete = null;
        this.actionError = 'Could not delete this document. Please try again.';
      }
    });
  }

  cancelDelete(): void {
    this.documentPendingDelete = null;
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.openMenuForId = null;
    this.statusMenuOpen = false;
  }

  private applyDocumentToList(updated: DocumentModel): void {
    this.documents = this.documents.map((d) => (d.id === updated.id ? updated : d));
  }

  /**
   * TASK-041: an active search bypasses the cache entirely (it's a one-off
   * query, not "returning to a screen already loaded"); the plain tab view
   * goes through staleWhileRevalidate, which renders the cached copy — set on
   * a previous visit this session — immediately, then reconciles with the
   * network response once it resolves. `loading` starts true so a genuinely
   * first-ever visit still shows the skeleton; it flips false on whichever
   * source (cache or network) emits first, which for a cache hit is within a
   * frame or two of navigating here.
   */
  private loadDocuments(): void {
    this.loading = true;
    this.loadError = false;

    const request$ = this.documentService.getAll({ type: this.activeTab, search: this.searchTerm || undefined });
    const source$ = this.searchTerm
      ? request$.pipe(map((documents) => ({ data: documents, fromCache: false })))
      : staleWhileRevalidate(this.cache, documentsListCacheKey(this.activeTab), request$);

    source$.subscribe({
      next: ({ data }) => {
        this.documents = data;
        this.loading = false;
      },
      error: () => {
        this.loadError = this.documents.length === 0;
        this.loading = false;
      }
    });
  }
}
