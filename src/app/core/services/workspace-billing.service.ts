import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BillingCycle, CheckoutSession, PricingCatalog, SubscriptionTier, WorkspaceBilling } from '../models/workspace-billing.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/workspace/billing`;

/** TASK-031/TASK-038: the current workspace's subscription tier/usage, the regional pricing catalog, and the (currently stubbed on the backend) upgrade checkout flow for /settings/billing. */
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
}
