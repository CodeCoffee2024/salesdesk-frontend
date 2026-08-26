import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TemplateService } from '../../core/services/template.service';
import { Template, TemplateTargetType } from '../../core/models/template.model';

const SWATCHES = ['#2D6A63', '#D9A441', '#8B5FBF', '#B1602C', '#3F6A96'];

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent implements OnInit {
  readonly swatches = SWATCHES;
  readonly targetTypeOptions: TemplateTargetType[] = ['QuotesAndInvoices', 'QuotesOnly', 'InvoicesOnly'];

  templates: Template[] = [];
  loading = true;
  loadError = false;

  showAddModal = false;
  form: FormGroup;
  saveError = '';
  saving = false;

  settingDefaultForId: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly templateService: TemplateService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      targetType: ['QuotesAndInvoices' as TemplateTargetType, Validators.required],
      description: [''],
      accentColor: [SWATCHES[0], Validators.required]
    });
  }

  ngOnInit(): void {
    this.load();
  }

  targetTypeLabel(type: TemplateTargetType): string {
    switch (type) {
      case 'QuotesOnly':
        return 'Quotes only';
      case 'InvoicesOnly':
        return 'Invoices only';
      default:
        return 'Quotes & invoices';
    }
  }

  get formErrors(): string[] {
    const errors: string[] = [];
    if (this.form.get('name')?.invalid) {
      errors.push('Name is required.');
    }
    return errors;
  }

  openAddModal(): void {
    this.form.reset({ name: '', targetType: 'QuotesAndInvoices', description: '', accentColor: SWATCHES[0] });
    this.saveError = '';
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  selectSwatch(color: string): void {
    this.form.patchValue({ accentColor: color });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = '';

    const { name, targetType, description, accentColor } = this.form.value;
    this.templateService.create({ name, targetType, description: description || null, accentColor }).subscribe({
      next: () => {
        this.saving = false;
        this.showAddModal = false;
        this.load();
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Could not add this template. Please try again.';
      }
    });
  }

  setDefault(template: Template): void {
    if (template.isDefault) {
      return;
    }

    this.settingDefaultForId = template.id;
    this.templateService.setDefault(template.id).subscribe({
      next: () => {
        this.settingDefaultForId = null;
        this.load();
      },
      error: () => {
        this.settingDefaultForId = null;
      }
    });
  }

  private load(): void {
    this.loading = true;
    this.loadError = false;

    this.templateService.getAll().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      }
    });
  }
}
