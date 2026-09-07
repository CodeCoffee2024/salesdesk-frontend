import { CreateDocumentLineItemRequest, DocumentType } from './document.model';

export type RecurrenceInterval = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface RecurringScheduleLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productId: string | null;
}

export interface RecurringSchedule {
  id: string;
  customerId: string;
  customerName: string;
  customerCompany: string;
  templateId: string;
  templateName: string;
  type: DocumentType;
  currency: string;
  clientCountry: string | null;
  dueDateOffsetDays: number;
  interval: RecurrenceInterval;
  nextRunDate: string;
  autoDispatch: boolean;
  isActive: boolean;
  createdAt: string;
  lineItems: RecurringScheduleLineItem[];
}

export interface CreateRecurringScheduleRequest {
  customerId: string;
  templateId: string;
  type: DocumentType;
  startDate: string;
  interval: RecurrenceInterval;
  dueDateOffsetDays: number;
  autoDispatch: boolean;
  lineItems: CreateDocumentLineItemRequest[];
  currency?: string | null;
  clientCountry?: string | null;
}
