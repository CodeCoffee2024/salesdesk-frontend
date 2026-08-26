export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  createdAt: string;
  lifetimeValue: number;
}

export interface CreateCustomerRequest {
  name: string;
  company: string;
  email: string;
  phone: string | null;
}

export type UpdateCustomerRequest = CreateCustomerRequest;
