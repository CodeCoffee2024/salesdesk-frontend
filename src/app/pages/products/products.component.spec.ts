import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { ProductsComponent } from './products.component';
import { ProductService } from '../../core/services/product.service';
import { WorkspaceProfileService } from '../../core/services/workspace-profile.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { HasRoleDirective } from '../../shared/has-role.directive';
import { CurrencyLocalePipe } from '../../core/pipes/currency-locale.pipe';
import { Product } from '../../core/models/product.model';
import { WorkspaceProfile } from '../../core/models/workspace-profile.model';

const workspaceProfile: WorkspaceProfile = {
  name: 'Northline',
  email: 'hello@northline.studio',
  tagline: null,
  address: null,
  logoUrl: null,
  country: 'US',
  defaultCurrency: 'USD'
};

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    name: 'Brand identity sprint',
    description: 'Strategy, visual direction, and a complete identity starter kit.',
    price: 4200,
    unit: 'Project',
    category: 'Branding',
    ...overrides
  };
}

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;
  let productServiceSpy: jasmine.SpyObj<ProductService>;

  function setup(products: Product[] = [makeProduct()]) {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getAll', 'create', 'update']);
    productServiceSpy.getAll.and.returnValue(of(products));
    productServiceSpy.create.and.returnValue(of(makeProduct({ id: 'prod-2', name: 'New Product' })));
    productServiceSpy.update.and.returnValue(of(makeProduct({ name: 'Updated name' })));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [ProductsComponent, EmptyStateComponent, HasRoleDirective, CurrencyLocalePipe],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: WorkspaceProfileService, useValue: { getCached: () => of(workspaceProfile) } }
      ]
    });

    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads and displays products', () => {
    setup();
    expect(productServiceSpy.getAll).toHaveBeenCalled();
    expect(component.products.length).toBe(1);
  });

  it('filters products by name, category, or description', () => {
    setup([
      makeProduct({ id: 'a', name: 'Brand identity sprint', category: 'Branding' }),
      makeProduct({ id: 'b', name: 'Web design & build', category: 'Web' })
    ]);

    component.searchTerm = 'web';
    expect(component.filteredProducts.map((p) => p.id)).toEqual(['b']);
  });

  it('shows a load error state when the API call fails', () => {
    productServiceSpy = jasmine.createSpyObj('ProductService', ['getAll', 'create', 'update']);
    productServiceSpy.getAll.and.returnValue(throwError(() => new Error('down')));

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [ProductsComponent, EmptyStateComponent, HasRoleDirective, CurrencyLocalePipe],
      providers: [
        { provide: ProductService, useValue: productServiceSpy },
        { provide: WorkspaceProfileService, useValue: { getCached: () => of(workspaceProfile) } }
      ]
    });
    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loadError).toBeTrue();
  });

  it('rejects an incomplete form without calling the API', () => {
    setup();
    component.openAddModal();
    component.form.patchValue({ name: '', price: 0 });

    component.submit();

    expect(productServiceSpy.create).not.toHaveBeenCalled();
  });

  it('submits a valid add form via create()', () => {
    setup();
    component.openAddModal();
    component.form.setValue({ name: 'New Product', price: 500, unit: 'Hour', description: '', category: '' });

    component.submit();

    expect(productServiceSpy.create).toHaveBeenCalledWith({
      name: 'New Product',
      price: 500,
      unit: 'Hour',
      description: null,
      category: null
    });
    expect(component.showModal).toBeFalse();
  });

  it('openEditModal pre-fills the form and submit() calls update()', () => {
    const product = makeProduct();
    setup([product]);

    component.openEditModal(product, new MouseEvent('click'));
    expect(component.form.value.name).toBe(product.name);

    component.submit();

    expect(productServiceSpy.update).toHaveBeenCalledWith(
      product.id,
      jasmine.objectContaining({ name: product.name, price: product.price })
    );
  });
});
