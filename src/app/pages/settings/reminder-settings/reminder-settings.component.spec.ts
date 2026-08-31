import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { ReminderSettingsComponent } from './reminder-settings.component';
import { ReminderSettingsService } from '../../../core/services/reminder-settings.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { HasRoleDirective } from '../../../shared/has-role.directive';
import { ReminderSettings } from '../../../core/models/reminder-settings.model';

function makeSettings(overrides: Partial<ReminderSettings> = {}): ReminderSettings {
  return {
    isEnabled: false,
    quoteFollowUpEnabled: true,
    invoiceDueWarningEnabled: true,
    overdueNoticesEnabled: true,
    ccEmail: null,
    ...overrides
  };
}

describe('ReminderSettingsComponent', () => {
  let component: ReminderSettingsComponent;
  let fixture: ComponentFixture<ReminderSettingsComponent>;
  let serviceSpy: jasmine.SpyObj<ReminderSettingsService>;

  function setup(settings: ReminderSettings = makeSettings()) {
    serviceSpy = jasmine.createSpyObj('ReminderSettingsService', ['get', 'save']);
    serviceSpy.get.and.returnValue(of(settings));
    serviceSpy.save.and.returnValue(of(settings));

    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [ReminderSettingsComponent, EmptyStateComponent, HasRoleDirective],
      providers: [{ provide: ReminderSettingsService, useValue: serviceSpy }]
    });

    fixture = TestBed.createComponent(ReminderSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the current settings on init', () => {
    setup(makeSettings({ isEnabled: true, ccEmail: 'owner@northline.studio' }));

    expect(serviceSpy.get).toHaveBeenCalled();
    expect(component.isEnabled).toBeTrue();
    expect(component.ccEmail).toBe('owner@northline.studio');
  });

  it('shows a load error state when the API call fails', () => {
    serviceSpy = jasmine.createSpyObj('ReminderSettingsService', ['get', 'save']);
    serviceSpy.get.and.returnValue(throwError(() => new Error('down')));

    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [ReminderSettingsComponent, EmptyStateComponent, HasRoleDirective],
      providers: [{ provide: ReminderSettingsService, useValue: serviceSpy }]
    });
    fixture = TestBed.createComponent(ReminderSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loadError).toBeTrue();
  });

  it('save() sends a blank CC field as null', () => {
    setup();
    component.ccEmail = '   ';

    component.save();

    expect(serviceSpy.save).toHaveBeenCalledWith(jasmine.objectContaining({ ccEmail: null }));
  });

  it('save() trims and forwards a non-empty CC field', () => {
    setup();
    component.ccEmail = '  owner@northline.studio  ';

    component.save();

    expect(serviceSpy.save).toHaveBeenCalledWith(jasmine.objectContaining({ ccEmail: 'owner@northline.studio' }));
  });

  it('save() surfaces an error without throwing', () => {
    setup();
    serviceSpy.save.and.returnValue(throwError(() => new Error('down')));

    component.save();

    expect(component.saveError).toBeTrue();
    expect(component.saving).toBeFalse();
  });
});
