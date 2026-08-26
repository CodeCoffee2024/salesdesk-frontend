import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TemplateService } from '../../../core/services/template.service';
import { Template } from '../../../core/models/template.model';
import { MERGE_TOKENS, MOCK_MERGE_VALUES, MergeTokenDefinition, resolveMergeTags } from '../../../core/utils/merge-tags';

type HeadingStyle = 'p' | 'h1' | 'h2' | 'h3';

const HEADING_OPTIONS: { value: HeadingStyle; label: string }[] = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' }
];

// execCommand('fontSize') only accepts the legacy 1–7 scale, not real point sizes.
const FONT_SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: '2', label: 'Small' },
  { value: '3', label: 'Normal' },
  { value: '5', label: 'Large' },
  { value: '7', label: 'X-Large' }
];

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss']
})
export class TemplateEditorComponent implements OnInit, AfterViewInit {
  @ViewChild('editorEl') editorElRef?: ElementRef<HTMLDivElement>;

  readonly mergeTokens = MERGE_TOKENS;
  readonly headingOptions = HEADING_OPTIONS;
  readonly fontSizeOptions = FONT_SIZE_OPTIONS;

  /** Computed once, not a getter: a getter bound to *ngFor rebuilds a fresh
   *  array of fresh objects on every change-detection cycle, which — with no
   *  trackBy — makes Angular destroy and recreate every token button on every
   *  tick. That's what silently broke "Insert field": mousedown fired change
   *  detection, which tore down the button that was about to receive the
   *  click's mouseup/click, leaving nothing listening at that DOM node by the
   *  time the click landed. A stable reference fixes it. */
  readonly tokensByGroup: { group: string; tokens: MergeTokenDefinition[] }[] =
    Array.from(new Set(MERGE_TOKENS.map((t) => t.group))).map((group) => ({
      group,
      tokens: MERGE_TOKENS.filter((t) => t.group === group)
    }));

  templateId = '';
  template: Template | null = null;
  loading = true;
  notFound = false;

  name = '';
  description = '';

  editorHtml = '';
  previewHtml = '';

  saving = false;
  saveError = '';
  saved = false;

  showInsertMenu = false;

  /** The editor's last known cursor/selection position, captured on every
   *  mouseup/keyup/input inside it. Clicking toolbar chrome (e.g. the "Insert
   *  field" <summary>) steals the browser's document selection away from the
   *  contenteditable entirely, so by the time a toolbar action runs there's
   *  often no selection left inside the editor for execCommand to act on —
   *  restoring this saved Range before every exec() call is what makes
   *  clicking a token actually insert it where the author was last editing. */
  private savedRange: Range | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly templateService: TemplateService
  ) {}

  ngOnInit(): void {
    this.templateId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  ngAfterViewInit(): void {
    this.syncEditorContent();
  }

  exec(command: string, value?: string): void {
    const el = this.editorElRef?.nativeElement;
    if (!el) {
      return;
    }

    el.focus();
    this.restoreSelection(el);
    document.execCommand(command, false, value);
    this.captureSelection(el);
    this.onEditorInput();
  }

  /** Bound to the editor's mouseup/keyup so normal clicking/typing keeps
   *  savedRange current for the next toolbar action. */
  captureSelection(el?: HTMLDivElement): void {
    const target = el ?? this.editorElRef?.nativeElement;
    const selection = window.getSelection();

    if (!target || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (target.contains(range.commonAncestorContainer)) {
      this.savedRange = range.cloneRange();
    }
  }

  private restoreSelection(el: HTMLDivElement): void {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    if (this.savedRange && el.contains(this.savedRange.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(this.savedRange);
      return;
    }

    // No usable saved position (e.g. the very first toolbar action before the
    // author has clicked into or typed in the editor yet) — default the
    // cursor to the end of whatever content is already there.
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  setHeading(style: HeadingStyle): void {
    this.exec('formatBlock', `<${style}>`);
  }

  setFontSize(size: string): void {
    this.exec('fontSize', size);
  }

  /** mousedown fires before the click moves focus off the contenteditable body,
   *  so preventing its default keeps the current text selection/cursor intact —
   *  otherwise the insert would land wherever focus ends up next, not where the
   *  author was editing. */
  preventFocusLoss(event: MouseEvent): void {
    event.preventDefault();
  }

  toggleInsertMenu(): void {
    this.showInsertMenu = !this.showInsertMenu;
  }

  insertToken(token: string): void {
    this.exec('insertText', `{{${token}}}`);
    this.showInsertMenu = false;
  }

  /** Closes the "Insert field" menu on any click outside it — it isn't a
   *  native <details>, so nothing does this automatically. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showInsertMenu) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target?.closest('.insert-field')) {
      this.showInsertMenu = false;
    }
  }

  onEditorInput(): void {
    this.editorHtml = this.editorElRef?.nativeElement.innerHTML ?? '';
    this.updatePreview();
  }

  save(): void {
    if (!this.name.trim()) {
      this.saveError = 'Name is required.';
      return;
    }

    if (!this.template) {
      return;
    }

    this.saving = true;
    this.saveError = '';
    this.saved = false;

    this.templateService
      .update(this.templateId, {
        name: this.name,
        targetType: this.template.targetType,
        description: this.description || null,
        accentColor: this.template.accentColor,
        contentHtml: this.editorHtml
      })
      .subscribe({
        next: (updated) => {
          this.template = updated;
          this.saving = false;
          this.saved = true;
        },
        error: () => {
          this.saving = false;
          this.saveError = 'Could not save this template. Please try again.';
        }
      });
  }

  backToTemplates(): void {
    this.router.navigate(['/templates']);
  }

  private load(): void {
    this.loading = true;
    this.notFound = false;

    // No GET /api/templates/{id} endpoint exists — the templates list is small
    // enough that reusing getAll() and finding the target client-side avoids
    // adding a new backend endpoint just for this page.
    this.templateService.getAll().subscribe({
      next: (templates) => {
        const found = templates.find((t) => t.id === this.templateId) ?? null;
        this.template = found;
        this.notFound = !found;
        this.loading = false;

        if (found) {
          this.name = found.name;
          this.description = found.description ?? '';
          this.editorHtml = found.contentHtml ?? '';
          this.updatePreview();
          this.syncEditorContent();
        }
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      }
    });
  }

  private syncEditorContent(): void {
    if (this.editorElRef) {
      this.editorElRef.nativeElement.innerHTML = this.editorHtml;
    }
  }

  private updatePreview(): void {
    // Guardrail (TASK-022): the preview pane is what stands in for "final,
    // client-facing output" here — it must never render a raw {{tag}}.
    this.previewHtml = resolveMergeTags(this.editorHtml, MOCK_MERGE_VALUES);
  }
}
