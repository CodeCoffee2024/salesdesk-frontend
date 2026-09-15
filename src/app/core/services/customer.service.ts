import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CreateCustomerRequest, Customer, UpdateCustomerRequest } from '../models/customer.model';
import { environment } from '../../../environments/environment';
import { LocalCacheService } from './local-cache.service';

const BASE_URL = `${environment.apiBaseUrl}/api/customers`;

/** TASK-041: the customers list is fetched unfiltered and filtered client-side, so it caches under one key rather than per-search-term. */
export const CUSTOMERS_LIST_CACHE_KEY = 'customers:list';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(
    private readonly http: HttpClient,
    private readonly cache: LocalCacheService
  ) {}

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(BASE_URL);
  }

  create(request: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(BASE_URL, request).pipe(tap((created) => this.cacheUpsert(created)));
  }

  update(id: string, request: UpdateCustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${BASE_URL}/${id}`, request).pipe(tap((updated) => this.cacheUpsert(updated)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${BASE_URL}/${id}`)
      .pipe(tap(() => void this.cache.removeFromMatchingLists(CUSTOMERS_LIST_CACHE_KEY, id)));
  }

  private cacheUpsert(customer: Customer): void {
    void this.cache.upsertInMatchingLists(CUSTOMERS_LIST_CACHE_KEY, customer);
  }
}
