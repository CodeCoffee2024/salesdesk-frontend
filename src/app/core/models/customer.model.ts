export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  /** Optional ISO 3166-1 alpha-2 code — the default a new document's ClientCountry override is drawn from (TASK-029). */
  country: string | null;
  createdAt: string;
  lifetimeValue: number;
}

export interface CreateCustomerRequest {
  name: string;
  company: string;
  email: string;
  phone: string | null;
  country?: string | null;
}

export type UpdateCustomerRequest = CreateCustomerRequest;
