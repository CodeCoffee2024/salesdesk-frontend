import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RevenueReport, TopCustomer, TopProduct } from '../models/report.model';
import { environment } from '../../../environments/environment';

const BASE_URL = `${environment.apiBaseUrl}/api/reports`;

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  constructor(private readonly http: HttpClient) {}

  getRevenue(from: string, to: string): Observable<RevenueReport> {
    return this.http.get<RevenueReport>(`${BASE_URL}/revenue`, { params: this.rangeParams(from, to) });
  }

  getTopCustomers(from: string, to: string): Observable<TopCustomer[]> {
    return this.http.get<TopCustomer[]>(`${BASE_URL}/top-customers`, { params: this.rangeParams(from, to) });
  }

  getTopProducts(from: string, to: string): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${BASE_URL}/top-products`, { params: this.rangeParams(from, to) });
  }

  private rangeParams(from: string, to: string): HttpParams {
    return new HttpParams().set('from', from).set('to', to);
  }
}
