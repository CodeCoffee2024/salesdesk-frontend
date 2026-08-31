import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { TemplateEditorComponent } from './template-editor.component';
import { TemplateService } from '../../../core/services/template.service';
import { Template } from '../../../core/models/template.model';

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'tpl-1',
    name: 'Studio Standard',
    description: 'Warm, editorial layout.',
    targetType: 'QuotesAndInvoices',
    accentColor: '#D9A441',
    contentHtml: '<p>Hi {{Customer.Name}}</p>',
    isDefault: true,
    usageCount: 4,
    ...overrides
  };
}

describe('TemplateEditorComponent', () => {
  let fixture: ComponentFixture<TemplateEditorComponent>;
  let component: TemplateEditorComponent;
  let templateServiceSpy: jasmine.SpyObj<TemplateService>;

  function setup(id: string, allTemplates: Template[] | 'error' = [makeTemplate()]) {
    templateServiceSpy = jasmine.createSpyObj('TemplateService', ['getAll', 'update']);
    templateServiceSpy.getAll.and.returnValue(
      allTemplates === 'error' ? throwError(() => new Error('boom')) : of(allTemplates)
    );
    templateServiceSpy.update.and.returnValue(of(makeTemplate({ name: 'Updated name' })));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule],
      declarations: [TemplateEditorComponent],
      providers: [
        { provide: TemplateService, useValue: templateServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } }
      ],
      // app-info-tooltip (TASK-029) is a real standalone-ish child component from
      // another module — stub it here rather than declaring it, matching the
      // pattern used for the app-shell's own child components in app.component.spec.ts.
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the matching template from the list and populates the form', () => {
    setup('tpl-1');

    expect(templateServiceSpy.getAll).toHaveBeenCalled();
    expect(component.notFound).toBeFalse();
    expect(component.name).toBe('Studio Standard');
    expect(component.editorHtml).toBe('<p>Hi {{Customer.Name}}</p>');
  });

  it('shows not-found when no template in the list matches the route id', () => {
    setup('missing-id', [makeTemplate({ id: 'tpl-1' })]);

    expect(component.notFound).toBeTrue();
    expect(component.template).toBeNull();
  });

  it('shows not-found when the list request fails', () => {
    setup('tpl-1', 'error');

    expect(component.notFound).toBeTrue();
  });

  // Guardrail (TASK-022): the live preview must show resolved values, never a
  // raw {{tag}}, since it's the stand-in for what a client would actually see.
  it('resolves merge tags in the live preview instead of showing raw tags', () => {
    setup('tpl-1');

    expect(component.previewHtml).not.toContain('{{');
    expect(component.previewHtml).not.toContain('}}');
    expect(component.previewHtml).toContain('Jordan Blake');
  });

  it('onEditorInput re-derives the preview from the current editor DOM content', () => {
    setup('tpl-1');
    const editorEl: HTMLDivElement = component.editorElRef!.nativeElement;
    editorEl.innerHTML = '<p>{{Document.Number}} for {{Customer.Company}}</p>';

    component.onEditorInput();

    expect(component.editorHtml).toBe('<p>{{Document.Number}} for {{Customer.Company}}</p>');
    expect(component.previewHtml).toBe('<p>INV-2026-014 for Northstar Studio</p>');
  });

  // Regression (reported live): clicking a token in the "Insert field" dropdown
  // did nothing, because opening the dropdown's <summary> steals the browser's
  // document selection away from the contenteditable body — by the time
  // insertToken() ran there was no cursor position left for execCommand to act
  // on. exec() now explicitly restores a saved Range before every command.
  it('insertToken still inserts after the document selection is lost elsewhere (dropdown click)', () => {
    setup('tpl-1');
    const editorEl: HTMLDivElement = component.editorElRef!.nativeElement;
    editorEl.innerHTML = '<p>Hello world</p>';

    // Place a real cursor inside the editor and capture it, the way typing or
    // clicking into the body would.
    const textNode = editorEl.querySelector('p')!.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 5);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    component.captureSelection();

    // Simulate opening the "Insert field" <summary> stealing the selection —
    // this is the actual browser behavior that caused the bug.
    const dummy = document.createElement('button');
    document.body.appendChild(dummy);
    dummy.focus();
    selection.removeAllRanges();

    component.insertToken('Customer.Name');

    expect(component.editorHtml).toContain('{{Customer.Name}}');
    document.body.removeChild(dummy);
  });

  it('insertToken falls back to appending at the end when nothing was ever selected', () => {
    setup('tpl-1');
    const editorEl: HTMLDivElement = component.editorElRef!.nativeElement;
    editorEl.innerHTML = '<p>Hello world</p>';

    component.insertToken('Document.Number');

    expect(component.editorHtml).toContain('{{Document.Number}}');
  });

  // Regression: the "Insert field" dropdown used a native <details>/<summary>,
  // which visually rendered its menu correctly but the token buttons weren't
  // actually clickable in a real browser (a <details>/absolutely-positioned-
  // child hit-testing quirk) — confirmed live, insertToken() never fired at
  // all despite the button appearing hovered in a screenshot. Replaced with a
  // plain Angular-toggled dropdown; these tests lock in that toggle behavior.
  it('toggleInsertMenu opens and closes the dropdown', () => {
    setup('tpl-1');
    expect(component.showInsertMenu).toBeFalse();

    component.toggleInsertMenu();
    expect(component.showInsertMenu).toBeTrue();

    component.toggleInsertMenu();
    expect(component.showInsertMenu).toBeFalse();
  });

  it('insertToken closes the dropdown after inserting', () => {
    setup('tpl-1');
    component.showInsertMenu = true;

    component.insertToken('Customer.Email');

    expect(component.showInsertMenu).toBeFalse();
    expect(component.editorHtml).toContain('{{Customer.Email}}');
  });

  it('onDocumentClick closes the dropdown when the click is outside it', () => {
    setup('tpl-1');
    component.showInsertMenu = true;

    component.onDocumentClick({ target: document.body } as unknown as MouseEvent);

    expect(component.showInsertMenu).toBeFalse();
  });

  it('onDocumentClick leaves the dropdown open when the click is inside it', () => {
    setup('tpl-1');
    component.showInsertMenu = true;
    const insertFieldEl = document.createElement('div');
    insertFieldEl.className = 'insert-field';
    const innerButton = document.createElement('button');
    insertFieldEl.appendChild(innerButton);
    document.body.appendChild(insertFieldEl);

    component.onDocumentClick({ target: innerButton } as unknown as MouseEvent);

    expect(component.showInsertMenu).toBeTrue();
    document.body.removeChild(insertFieldEl);
  });

  it('save sends the current name, edited body, and unchanged metadata', () => {
    setup('tpl-1');
    component.name = 'Studio Standard v2';
    component.editorHtml = '<p>New body</p>';

    component.save();

    expect(templateServiceSpy.update).toHaveBeenCalledWith('tpl-1', {
      name: 'Studio Standard v2',
      targetType: 'QuotesAndInvoices',
      description: 'Warm, editorial layout.',
      accentColor: '#D9A441',
      contentHtml: '<p>New body</p>'
    });
    expect(component.saved).toBeTrue();
  });

  it('save is rejected client-side when the name is blank', () => {
    setup('tpl-1');
    component.name = '   ';

    component.save();

    expect(templateServiceSpy.update).not.toHaveBeenCalled();
    expect(component.saveError).toContain('Name is required');
  });

  it('save surfaces an error and stops saving on failure', () => {
    setup('tpl-1');
    templateServiceSpy.update.and.returnValue(throwError(() => new Error('boom')));

    component.save();

    expect(component.saving).toBeFalse();
    expect(component.saveError).toContain('Could not save');
  });

  it('backToTemplates navigates to the templates list', () => {
    setup('tpl-1');
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');

    component.backToTemplates();

    expect(navigateSpy).toHaveBeenCalledWith(['/templates']);
  });
});
