import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BillingComponent } from './billing.component';
import { WorkspaceBillingService } from '../../../core/services/workspace-billing.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { WorkspaceBilling } from '../../../core/models/workspace-billing.model';

function makeBilling(overrides: Partial<WorkspaceBilling> = {}): WorkspaceBilling {
  return {
    subscriptionTier: 'Free',
    subscriptionEndDate: null,
    isEarlyBirdPromo: false,
    ...overrides
  };
}

describe('BillingComponent', () => {
  let component: BillingComponent;
  let fixture: ComponentFixture<BillingComponent>;
  let serviceSpy: jasmine.SpyObj<WorkspaceBillingService>;

  function setup(billing: WorkspaceBilling = makeBilling()) {
    serviceSpy = jasmine.createSpyObj('WorkspaceBillingService', ['get']);
    serviceSpy.get.and.returnValue(of(billing));

    TestBed.configureTestingModule({
      declarations: [BillingComponent, EmptyStateComponent],
      providers: [{ provide: WorkspaceBillingService, useValue: serviceSpy }]
    });

    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the current billing details on init', () => {
    setup(makeBilling({ subscriptionTier: 'Premium' }));

    expect(serviceSpy.get).toHaveBeenCalled();
    expect(component.isPremium).toBeTrue();
  });

  it('shows a load error state when the API call fails', () => {
    serviceSpy = jasmine.createSpyObj('WorkspaceBillingService', ['get']);
    serviceSpy.get.and.returnValue(throwError(() => new Error('down')));

    TestBed.configureTestingModule({
      declarations: [BillingComponent, EmptyStateComponent],
      providers: [{ provide: WorkspaceBillingService, useValue: serviceSpy }]
    });
    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loadError).toBeTrue();
  });

  it('shows the early-bird promo banner and expiration date for a promo workspace', () => {
    setup(makeBilling({ subscriptionTier: 'Premium', isEarlyBirdPromo: true, subscriptionEndDate: '2027-09-01T00:00:00Z' }));

    const banner = fixture.nativeElement.querySelector('.early-bird-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('first 100');
  });

  it('does not show the early-bird promo banner for a standard Free workspace', () => {
    setup(makeBilling());

    expect(fixture.nativeElement.querySelector('.early-bird-banner')).toBeNull();
  });
});
