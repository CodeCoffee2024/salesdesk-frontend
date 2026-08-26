import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

  get tokensByGroup(): { group: string; tokens: MergeTokenDefinition[] }[] {
    const groups = Array.from(new Set(this.mergeTokens.map((t) => t.group)));
    return groups.map((group) => ({ group, tokens: this.mergeTokens.filter((t) => t.group === group) }));
  }

  exec(command: string, value?: string): void {
    this.editorElRef?.nativeElement.focus();
    document.execCommand(command, false, value);
    this.onEditorInput();
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

  insertToken(token: string): void {
    this.exec('insertText', `{{${token}}}`);
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
