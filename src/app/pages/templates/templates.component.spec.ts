import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { TemplatesComponent } from './templates.component';
import { TemplateService } from '../../core/services/template.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { HasRoleDirective } from '../../shared/has-role.directive';
import { Template } from '../../core/models/template.model';

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'tpl-1',
    name: 'Studio Standard',
    description: 'Warm, editorial layout for polished client work.',
    targetType: 'QuotesAndInvoices',
    accentColor: '#D9A441',
    isDefault: true,
    usageCount: 4,
    ...overrides
  };
}

describe('TemplatesComponent', () => {
  let component: TemplatesComponent;
  let fixture: ComponentFixture<TemplatesComponent>;
  let templateServiceSpy: jasmine.SpyObj<TemplateService>;

  function setup(templates: Template[] = [makeTemplate()]) {
    templateServiceSpy = jasmine.createSpyObj('TemplateService', ['getAll', 'create', 'setDefault']);
    templateServiceSpy.getAll.and.returnValue(of(templates));
    templateServiceSpy.create.and.returnValue(of(makeTemplate({ id: 'tpl-2', name: 'New Template', isDefault: false })));
    templateServiceSpy.setDefault.and.returnValue(of(makeTemplate({ id: 'tpl-2', isDefault: true })));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [TemplatesComponent, EmptyStateComponent, HasRoleDirective],
      providers: [{ provide: TemplateService, useValue: templateServiceSpy }]
    });

    fixture = TestBed.createComponent(TemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads and displays templates', () => {
    setup();
    expect(templateServiceSpy.getAll).toHaveBeenCalled();
    expect(component.templates.length).toBe(1);
  });

  it('shows a load error state when the API call fails', () => {
    templateServiceSpy = jasmine.createSpyObj('TemplateService', ['getAll', 'create', 'setDefault']);
    templateServiceSpy.getAll.and.returnValue(throwError(() => new Error('down')));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [TemplatesComponent, EmptyStateComponent, HasRoleDirective],
      providers: [{ provide: TemplateService, useValue: templateServiceSpy }]
    });
    fixture = TestBed.createComponent(TemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loadError).toBeTrue();
  });

  it('rejects an incomplete add form without calling the API', () => {
    setup();
    component.openAddModal();
    component.form.patchValue({ name: '' });

    component.submit();

    expect(templateServiceSpy.create).not.toHaveBeenCalled();
  });

  it('submits a valid add form with the selected swatch color', () => {
    setup();
    component.openAddModal();
    component.selectSwatch('#8B5FBF');
    component.form.patchValue({ name: 'New Template' });

    component.submit();

    expect(templateServiceSpy.create).toHaveBeenCalledWith({
      name: 'New Template',
      targetType: 'QuotesAndInvoices',
      description: null,
      accentColor: '#8B5FBF'
    });
    expect(component.showAddModal).toBeFalse();
  });

  it('setDefault calls the API for a non-default template and reloads', () => {
    const nonDefault = makeTemplate({ id: 'tpl-2', isDefault: false });
    setup([makeTemplate(), nonDefault]);

    component.setDefault(nonDefault);

    expect(templateServiceSpy.setDefault).toHaveBeenCalledWith('tpl-2');
  });

  it('setDefault does nothing for a template that is already default', () => {
    const current = makeTemplate();
    setup([current]);

    component.setDefault(current);

    expect(templateServiceSpy.setDefault).not.toHaveBeenCalled();
  });
});
