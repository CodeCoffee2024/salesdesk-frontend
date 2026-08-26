import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateCustomerRequest, Customer, UpdateCustomerRequest } from '../models/customer.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/customers`;

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(BASE_URL);
  }

  create(request: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(BASE_URL, request);
  }

  update(id: string, request: UpdateCustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${BASE_URL}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE_URL}/${id}`);
  }
}
