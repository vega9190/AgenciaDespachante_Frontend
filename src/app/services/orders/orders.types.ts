export interface OrdersListQuery {
  page?: number;
  pageSize?: number;
  orderNumber?: string;
  containerNumber?: string;
  clientId?: string;
  statusId?: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface OrderListItemDto {
  id: string;
  orderNumber: number;
  containerNumber: string;
  clientFullName: string;
  clientTaxId?: string | null;
  statusId: string;
  statusName: string;
  createdUtc: string;
  totalPaymentsAmount: number;
}

export interface OrderStatusOptionDto {
  id: string;
  name: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CreateOrderRequest {
  clientId: string;
  containerNumber: string;
  containerType: number;
}

export interface UpdateOrderRequest {
  clientId: string;
  containerNumber: string;
  containerType: number;
}

export interface UpdateOrderStatusRequest {
  statusId: string;
}

export interface SaveOrderDocumentRequest {
  orderDocumentTypeId: string;
  file: File;
}

export interface SaveOrderPaymentRequest {
  amount: number;
  paymentDate: string;
  type: number;
  notes?: string;
  orderDocumentTypeId?: string;
  document?: File;
}
