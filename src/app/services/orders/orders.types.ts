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

export interface OrderDetailDto {
  id: string;
  orderNumber: number;
  containerNumber: string;
  containerType: number;
  clientId: string;
  clientFullName: string;
  clientTaxId?: string | null;
  statusId: string;
  statusName: string;
  createdUtc: string;
  documents: OrderDocumentDto[];
  orderDocumentTypeRequireds: OrderDocumentTypeRequiredDto[];
  payments: OrderPaymentDto[];
  orderLogs: OrderLogDto[];
}

export interface OrderDocumentDto {
  id: string;
  orderDocumentTypeId: string;
  orderDocumentTypeName: string;
  originalName: string;
  filesize: number;
  createdUtc: string;
}

export interface OrderDocumentTypeRequiredDto {
  orderDocumentTypeId: string;
  orderDocumentTypeName: string;
  isRequired: boolean;
  status: number;
  sortOrder: number;
}

export interface OrderPaymentDto {
  id: string;
  amount: number;
  paymentDate: string;
  type: number;
  createdById: string;
  createdByUsername: string;
  orderDocumentId?: string | null;
  notes?: string | null;
  createdUtc: string;
}

export interface OrderLogDto {
  id: string;
  action: number;
  message: string;
  actorUserName: string;
  occurredAt: string;
}

export interface OrderStatusOptionDto {
  id: string;
  name: string;
}

export interface OrderDocumentTypeOptionDto {
  id: string;
  name: string;
  category: number;
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

export interface SaveOrderDocumentResponse {
  id: string;
  isStatusUpdated: boolean;
  requiredDocumentStatus?: number | null;
}

export interface DeleteOrderDocumentResponse {
  requiredDocumentStatus?: number | null;
}

export interface ApproveOrderDocumentTypeResponse {
  isStatusUpdated: boolean;
}

export interface SaveOrderPaymentRequest {
  amount: number;
  paymentDate: string;
  type: number;
  notes?: string;
  orderDocumentTypeId?: string;
  document?: File;
}

export interface ContainerTypeOption {
  label: string;
  value: number;
}

export const CONTAINER_TYPE_OPTIONS: ContainerTypeOption[] = [
  { label: '20ft', value: 1 },
  { label: '40ft', value: 2 }
];
