export type ProductUnit = 'Project' | 'Hour' | 'Day' | 'Month';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: ProductUnit;
  category: string | null;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  unit: ProductUnit;
  description: string | null;
  category: string | null;
}

export type UpdateProductRequest = CreateProductRequest;
