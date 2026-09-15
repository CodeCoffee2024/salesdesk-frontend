import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';

import { RecurringSchedulesComponent } from './recurring-schedules.component';
import { RecurringScheduleService } from '../../../core/services/recurring-schedule.service';
import { CustomerService } from '../../../core/services/customer.service';
import { TemplateService } from '../../../core/services/template.service';
import { HasRoleDirective } from '../../../shared/has-role.directive';
import { TooltipDirective } from '../../../shared/tooltip.directive';
import { SkeletonListComponent } from '../../../shared/skeleton/skeleton-list.component';
import { SkeletonRowComponent } from '../../../shared/skeleton/skeleton-row.component';
import { SkeletonCardComponent } from '../../../shared/skeleton/skeleton-card.component';
import { SkeletonLineComponent } from '../../../shared/skeleton/skeleton-line.component';
import { RecurringSchedule } from '../../../core/models/recurring-schedule.model';

function makeSchedule(overrides: Partial<RecurringSchedule> = {}): RecurringSchedule {
  return {
    id: 'sched-1',
    customerId: 'cust-1',
    customerName: 'Maya Chen',
    customerCompany: 'Northstar Studio',
    templateId: 'tpl-1',
    templateName: 'Studio Standard',
    type: 'Invoice',
    currency: 'USD',
    clientCountry: null,
    dueDateOffsetDays: 14,
    interval: 'Monthly',
    nextRunDate: '2026-10-01',
    autoDispatch: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    lineItems: [],
    ...overrides
  };
}

describe('RecurringSchedulesComponent', () => {
  let component: RecurringSchedulesComponent;
  let fixture: ComponentFixture<RecurringSchedulesComponent>;
  let scheduleServiceSpy: jasmine.SpyObj<RecurringScheduleService>;

  function setup(schedules: RecurringSchedule[] = [makeSchedule()]) {
    scheduleServiceSpy = jasmine.createSpyObj('RecurringScheduleService', ['getAll', 'create', 'pause', 'resume', 'delete']);
    scheduleServiceSpy.getAll.and.returnValue(of(schedules));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [
        RecurringSchedulesComponent,
        HasRoleDirective,
        TooltipDirective,
        SkeletonListComponent,
        SkeletonRowComponent,
        SkeletonCardComponent,
        SkeletonLineComponent
      ],
      providers: [
        { provide: RecurringScheduleService, useValue: scheduleServiceSpy },
        { provide: CustomerService, useValue: { getAll: () => of([]) } },
        { provide: TemplateService, useValue: { getAll: () => of([]) } }
      ]
    });

    fixture = TestBed.createComponent(RecurringSchedulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads and displays schedules', () => {
    setup();
    expect(component.schedules.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('toggleActive flips the row immediately, before the server responds', () => {
    const schedule = makeSchedule({ isActive: true });
    setup([schedule]);
    scheduleServiceSpy.pause.and.returnValue(new Subject<RecurringSchedule>());

    component.toggleActive(component.schedules[0]);

    expect(scheduleServiceSpy.pause).toHaveBeenCalledWith('sched-1');
    expect(component.schedules[0].isActive).toBeFalse();
  });

  it('toggleActive rolls back and surfaces an inline error if the request fails', () => {
    const schedule = makeSchedule({ isActive: true });
    setup([schedule]);
    scheduleServiceSpy.pause.and.returnValue(throwError(() => new Error('down')));

    component.toggleActive(component.schedules[0]);

    expect(component.schedules[0].isActive).toBeTrue();
    expect(component.toggleError).toContain('Maya Chen');
  });

  it('toggleActive calls resume() for a paused schedule', () => {
    const schedule = makeSchedule({ isActive: false });
    setup([schedule]);
    scheduleServiceSpy.resume.and.returnValue(of(makeSchedule({ isActive: true })));

    component.toggleActive(component.schedules[0]);

    expect(scheduleServiceSpy.resume).toHaveBeenCalledWith('sched-1');
    expect(component.schedules[0].isActive).toBeTrue();
  });
});
