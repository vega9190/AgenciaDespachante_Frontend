export interface OrdersListQuery {
  page?: number;
  pageSize?: number;
  orderNumber?: string;
  containerNumber?: string;
  clientName?: string;
  clientTaxId?: string;
  statusId?: string;
  sortBy?: string;
  sortDirection?: string;
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
