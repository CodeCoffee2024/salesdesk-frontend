import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DocumentService } from '../../../core/services/document.service';
import { Document as DocumentModel, DocumentStatus } from '../../../core/models/document.model';

type DocumentTab = 'all' | 'quote' | 'invoice';

const SEARCH_DEBOUNCE_MS = 300;
const HIGHLIGHT_DURATION_MS = 4000;

@Component({
  selector: 'app-documents-list',
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.scss']
})
export class DocumentsListComponent implements OnInit {
  readonly statusOptions: DocumentStatus[] = ['Draft', 'Sent', 'Overdue', 'Accepted', 'Paid'];

  documents: DocumentModel[] = [];
  loading = true;
  loadError = false;

  activeTab: DocumentTab = 'all';
  searchTerm = '';

  openMenuForId: string | null = null;
  statusMenuOpen = false;
  documentPendingDelete: DocumentModel | null = null;

  /** The document a create/edit flow just navigated here from, briefly highlighted. */
  highlightedDocumentId: string | null = null;

  private readonly searchInput$ = new Subject<string>();

  constructor(
    private readonly documentService: DocumentService,
    private readonly router: Router
  ) {
    // Only readable during construction of the component a navigation targets —
    // this is how the document-form's `{ state: { highlightId } }` extra arrives.
    const state = this.router.getCurrentNavigation()?.extras.state as { highlightId?: string } | undefined;
    this.highlightedDocumentId = state?.highlightId ?? null;
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

  changeStatus(document: DocumentModel, status: DocumentStatus): void {
    this.documentService.updateStatus(document.id, status).subscribe(() => {
      this.closeMenu();
      this.loadDocuments();
    });
  }

  requestDelete(document: DocumentModel): void {
    this.documentPendingDelete = document;
    this.closeMenu();
  }

  confirmDelete(): void {
    if (!this.documentPendingDelete) {
      return;
    }

    this.documentService.delete(this.documentPendingDelete.id).subscribe(() => {
      this.documentPendingDelete = null;
      this.loadDocuments();
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

  private loadDocuments(): void {
    this.loading = true;
    this.loadError = false;

    this.documentService.getAll({ type: this.activeTab, search: this.searchTerm || undefined }).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }
}
