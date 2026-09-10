export interface RevenuePoint {
  label: string;
  amount: number;
}

export interface RevenueReport {
  points: RevenuePoint[];
  outstanding: number;
  baseCurrency: string;
}

export interface TopCustomer {
  customerId: string;
  name: string;
  company: string;
  billedTotal: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  quantity: number;
  amount: number;
}
