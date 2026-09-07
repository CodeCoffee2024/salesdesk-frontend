import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Customer } from '../../../core/models/customer.model';
import { CreateDocumentLineItemRequest } from '../../../core/models/document.model';
import {
  CreateRecurringScheduleRequest,
  RecurrenceInterval,
  RecurringSchedule,
} from '../../../core/models/recurring-schedule.model';
import { Template } from '../../../core/models/template.model';
import { CustomerService } from '../../../core/services/customer.service';
import { RecurringScheduleService } from '../../../core/services/recurring-schedule.service';
import { TemplateService } from '../../../core/services/template.service';

@Component({
  selector: 'app-recurring-schedules',
  templateUrl: './recurring-schedules.component.html',
  styleUrls: ['./recurring-schedules.component.scss'],
})
export class RecurringSchedulesComponent implements OnInit {
  schedules: RecurringSchedule[] = [];
  customers: Customer[] = [];
  templates: Template[] = [];

  loading = true;
  loadError = false;

  showModal = false;
  saving = false;
  saveError = '';

  scheduleForDeletion: RecurringSchedule | null = null;
  deleteError = '';

  /** Row currently mid pause/resume request — disables that row's toggle button so a slow request can't be double-fired. */
  togglingId: string | null = null;

  readonly intervals: RecurrenceInterval[] = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];

  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly scheduleService: RecurringScheduleService,
    private readonly customerService: CustomerService,
    private readonly templateService: TemplateService,
  ) {
    this.form = this.fb.group({
      customerId: ['', Validators.required],
      templateId: ['', Validators.required],
      type: ['Invoice', Validators.required],
      startDate: ['', Validators.required],
      interval: ['Monthly' as RecurrenceInterval, Validators.required],
      dueDateOffsetDays: [14, [Validators.required, Validators.min(0)]],
      autoDispatch: [false],
      lineItems: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;

    forkJoin({
      schedules: this.scheduleService.getAll(),
      customers: this.customerService.getAll(),
      templates: this.templateService.getAll(),
    }).subscribe({
      next: ({ schedules, customers, templates }) => {
        this.schedules = schedules;
        this.customers = customers;
        this.templates = templates;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  addLineItem(): void {
    this.lineItems.push(
      this.fb.group({
        description: ['', Validators.required],
        quantity: [1, [Validators.required, Validators.min(0.01)]],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        productId: [null as string | null],
      }),
    );
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
  }

  openCreateModal(): void {
    this.saveError = '';
    this.form.reset({
      customerId: '',
      templateId: this.templates.find((t) => t.isDefault)?.id ?? this.templates[0]?.id ?? '',
      type: 'Invoice',
      startDate: this.today(),
      interval: 'Monthly',
      dueDateOffsetDays: 14,
      autoDispatch: false,
    });
    this.lineItems.clear();
    this.addLineItem();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submit(): void {
    if (this.form.invalid || this.lineItems.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = '';

    const lineItems: CreateDocumentLineItemRequest[] = this.lineItems.controls.map((control) => ({
      description: control.value.description,
      quantity: Number(control.value.quantity),
      unitPrice: Number(control.value.unitPrice),
      productId: control.value.productId,
    }));

    const request: CreateRecurringScheduleRequest = {
      customerId: this.form.value.customerId,
      templateId: this.form.value.templateId,
      type: this.form.value.type,
      startDate: this.form.value.startDate,
      interval: this.form.value.interval,
      dueDateOffsetDays: Number(this.form.value.dueDateOffsetDays),
      autoDispatch: this.form.value.autoDispatch,
      lineItems,
    };

    this.scheduleService.create(request).subscribe({
      next: (created) => {
        this.schedules = [...this.schedules, created].sort((a, b) => a.nextRunDate.localeCompare(b.nextRunDate));
        this.saving = false;
        this.showModal = false;
      },
      error: () => {
        this.saving = false;
        this.saveError = 'Could not create the schedule. Please check the form and try again.';
      },
    });
  }

  toggleActive(schedule: RecurringSchedule): void {
    this.togglingId = schedule.id;
    const action = schedule.isActive ? this.scheduleService.pause(schedule.id) : this.scheduleService.resume(schedule.id);

    action.subscribe({
      next: (updated) => {
        this.schedules = this.schedules.map((s) => (s.id === updated.id ? updated : s));
        this.togglingId = null;
      },
      error: () => {
        this.togglingId = null;
      },
    });
  }

  requestDelete(schedule: RecurringSchedule): void {
    this.deleteError = '';
    this.scheduleForDeletion = schedule;
  }

  cancelDelete(): void {
    this.scheduleForDeletion = null;
  }

  confirmDelete(): void {
    if (!this.scheduleForDeletion) {
      return;
    }

    const id = this.scheduleForDeletion.id;
    this.scheduleService.delete(id).subscribe({
      next: () => {
        this.schedules = this.schedules.filter((s) => s.id !== id);
        this.scheduleForDeletion = null;
      },
      error: () => {
        this.deleteError = 'Could not delete this schedule. Please try again.';
      },
    });
  }

  lineTotal(index: number): number {
    const group = this.lineItems.at(index);
    const quantity = Number(group.get('quantity')?.value) || 0;
    const unitPrice = Number(group.get('unitPrice')?.value) || 0;
    return quantity * unitPrice;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
