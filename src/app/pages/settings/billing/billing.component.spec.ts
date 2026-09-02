import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { BillingComponent } from './billing.component';
import { WorkspaceBillingService } from '../../../core/services/workspace-billing.service';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { PricingCatalog, WorkspaceBilling } from '../../../core/models/workspace-billing.model';

function makeBilling(overrides: Partial<WorkspaceBilling> = {}): WorkspaceBilling {
  return {
    subscriptionTier: 'Free',
    subscriptionEndDate: null,
    isEarlyBirdPromo: false,
    monthlyDocumentLimit: 5,
    documentsIssuedThisMonth: 2,
    ...overrides
  };
}

function makePricing(): PricingCatalog {
  return {
    region: 'Global',
    currency: 'USD',
    tiers: [
      { tier: 'Free', displayName: 'Free / Starter', currency: 'USD', monthlyPrice: 0, annualPrice: 0, monthlyDocumentLimit: 5, maxUsers: 1, features: ['5 documents/month'] },
      { tier: 'Pro', displayName: 'Pro Freelancer', currency: 'USD', monthlyPrice: 9.99, annualPrice: 99.99, monthlyDocumentLimit: null, maxUsers: 1, features: ['Unlimited documents'] },
      { tier: 'Studio', displayName: 'Studio / Agency', currency: 'USD', monthlyPrice: 29.99, annualPrice: 299.99, monthlyDocumentLimit: null, maxUsers: null, features: ['Multi-user RBAC'] }
    ]
  };
}

describe('BillingComponent', () => {
  let component: BillingComponent;
  let fixture: ComponentFixture<BillingComponent>;
  let serviceSpy: jasmine.SpyObj<WorkspaceBillingService>;

  function setup(billing: WorkspaceBilling = makeBilling(), pricing: PricingCatalog = makePricing()) {
    serviceSpy = jasmine.createSpyObj('WorkspaceBillingService', ['get', 'getPricing', 'createCheckoutSession']);
    serviceSpy.get.and.returnValue(of(billing));
    serviceSpy.getPricing.and.returnValue(of(pricing));

    TestBed.configureTestingModule({
      declarations: [BillingComponent, EmptyStateComponent],
      providers: [{ provide: WorkspaceBillingService, useValue: serviceSpy }]
    });

    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads the current billing details and pricing catalog on init', () => {
    setup(makeBilling({ subscriptionTier: 'Pro' }));

    expect(serviceSpy.get).toHaveBeenCalled();
    expect(serviceSpy.getPricing).toHaveBeenCalled();
    expect(component.isCurrentTier('Pro')).toBeTrue();
    expect(component.isCurrentTier('Free')).toBeFalse();
  });

  it('shows a load error state when the API call fails', () => {
    serviceSpy = jasmine.createSpyObj('WorkspaceBillingService', ['get', 'getPricing', 'createCheckoutSession']);
    serviceSpy.get.and.returnValue(throwError(() => new Error('down')));
    serviceSpy.getPricing.and.returnValue(of(makePricing()));

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
    setup(makeBilling({ subscriptionTier: 'Pro', isEarlyBirdPromo: true, subscriptionEndDate: '2027-09-01T00:00:00Z' }));

    const banner = fixture.nativeElement.querySelector('.early-bird-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('first 100');
  });

  it('does not show the early-bird promo banner for a standard Free workspace', () => {
    setup(makeBilling());

    expect(fixture.nativeElement.querySelector('.early-bird-banner')).toBeNull();
  });

  it('renders all three pricing tiers from the catalog', () => {
    setup();

    const cards = fixture.nativeElement.querySelectorAll('.pricing-card');
    expect(cards.length).toBe(3);
  });

  it('uses annual pricing once the Annual toggle is selected', () => {
    setup();

    component.billingCycle = 'Annual';
    const proTier = makePricing().tiers[1];

    expect(component.priceFor(proTier)).toBe(99.99);
  });

  it('redirects to the checkout URL on a successful upgrade', () => {
    setup();
    const session = { checkoutUrl: 'https://checkout.example.test/abc', providerReference: 'sess_abc' };
    serviceSpy.createCheckoutSession.and.returnValue(of(session));
    // Spied rather than left to run for real — assigning window.location.href
    // in a Karma test would attempt a real navigation of the test iframe.
    const redirectSpy = spyOn<any>(component, 'redirectTo');
    const proTier = makePricing().tiers[1];

    component.upgrade(proTier);

    expect(serviceSpy.createCheckoutSession).toHaveBeenCalledWith('Pro', 'Monthly');
    expect(redirectSpy).toHaveBeenCalledWith(session.checkoutUrl);
  });

  it('shows a friendly message when checkout is not configured yet (503)', () => {
    setup();
    serviceSpy.createCheckoutSession.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    const proTier = makePricing().tiers[1];

    component.upgrade(proTier);

    expect(component.checkoutError).toContain("aren't available yet");
    expect(component.checkingOutTier).toBeNull();
  });
});
