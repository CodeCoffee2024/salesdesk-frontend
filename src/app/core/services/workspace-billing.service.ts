import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BillingCycle,
  CheckoutSession,
  GCashPaymentDetails,
  GCashSubmissionConfirmation,
  PricingCatalog,
  SubmitGCashPaymentRequest,
  SubscriptionTier,
  WorkspaceBilling
} from '../models/workspace-billing.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/workspace/billing`;

/** TASK-031/TASK-038/TASK-039: the current workspace's subscription tier/usage, the regional pricing catalog, the (currently stubbed on the backend) card checkout flow, and the manual GCash proof-of-payment flow for /settings/billing. */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceBillingService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<WorkspaceBilling> {
    return this.http.get<WorkspaceBilling>(BASE_URL);
  }

  getPricing(): Observable<PricingCatalog> {
    return this.http.get<PricingCatalog>(`${BASE_URL}/pricing`);
  }

  createCheckoutSession(tier: SubscriptionTier, billingCycle: BillingCycle): Observable<CheckoutSession> {
    return this.http.post<CheckoutSession>(`${BASE_URL}/checkout-session`, { tier, billingCycle });
  }

  getGCashDetails(): Observable<GCashPaymentDetails> {
    return this.http.get<GCashPaymentDetails>(`${BASE_URL}/gcash-details`);
  }

  submitGCashPayment(request: SubmitGCashPaymentRequest): Observable<GCashSubmissionConfirmation> {
    return this.http.post<GCashSubmissionConfirmation>(`${BASE_URL}/gcash-submit`, request);
  }
}
