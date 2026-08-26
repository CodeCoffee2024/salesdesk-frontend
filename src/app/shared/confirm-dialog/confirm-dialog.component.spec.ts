import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits confirmed when the confirm button is clicked', () => {
    const spy = jasmine.createSpy('confirmed');
    component.confirmed.subscribe(spy);

    fixture.nativeElement.querySelector('.confirm-dialog__confirm').click();

    expect(spy).toHaveBeenCalled();
  });

  it('emits cancelled when the cancel button is clicked', () => {
    const spy = jasmine.createSpy('cancelled');
    component.cancelled.subscribe(spy);

    fixture.nativeElement.querySelector('.confirm-dialog__cancel').click();

    expect(spy).toHaveBeenCalled();
  });

  it('emits cancelled when the backdrop is clicked, but not when the dialog body is clicked', () => {
    const spy = jasmine.createSpy('cancelled');
    component.cancelled.subscribe(spy);

    fixture.nativeElement.querySelector('.confirm-dialog').click();
    expect(spy).not.toHaveBeenCalled();

    fixture.nativeElement.querySelector('.confirm-dialog__backdrop').click();
    expect(spy).toHaveBeenCalled();
  });
});
