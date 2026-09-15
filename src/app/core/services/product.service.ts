import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CreateProductRequest, Product, UpdateProductRequest } from '../models/product.model';
import { environment } from '../../../environments/environment';
import { LocalCacheService } from './local-cache.service';

const BASE_URL = `${environment.apiBaseUrl}/api/products`;

/** TASK-041: the catalog is fetched unfiltered and filtered client-side, so it caches under one key rather than per-search-term. */
export const PRODUCTS_LIST_CACHE_KEY = 'products:list';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private readonly http: HttpClient,
    private readonly cache: LocalCacheService
  ) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(BASE_URL);
  }

  create(request: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(BASE_URL, request).pipe(tap((created) => this.cacheUpsert(created)));
  }

  update(id: string, request: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${BASE_URL}/${id}`, request).pipe(tap((updated) => this.cacheUpsert(updated)));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${BASE_URL}/${id}`)
      .pipe(tap(() => void this.cache.removeFromMatchingLists(PRODUCTS_LIST_CACHE_KEY, id)));
  }

  private cacheUpsert(product: Product): void {
    void this.cache.upsertInMatchingLists(PRODUCTS_LIST_CACHE_KEY, product);
  }
}
