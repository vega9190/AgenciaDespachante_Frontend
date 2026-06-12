import { DriverDetailDto } from '../drivers/drivers.types';

export interface ImportsListQuery {
  page?: number;
  pageSize?: number;
  importNumber?: string;
  containerNumber?: string;
  clientId?: string;
  statusId?: string;
  sortBy?: string;
  sortDirection?: string;
}

export enum ImportDocumentCategory {
  Gestion = 1,
  Pagos = 2
}

export enum ImportPaymentType {
  Efectivo = 1,
  Transferencia = 2,
  QR = 3
}

export interface ImportPaymentTypeOption {
  label: string;
  value: ImportPaymentType;
}

export interface ImportListItemDto {
  id: string;
  importNumber: number;
  containerNumber: string;
  clientFullName: string;
  clientTaxId?: string | null;
  statusId: string;
  statusName: string;
  charge: number;
  createdUtc: string;
  totalPaymentsAmount: number;
}

export interface ImportDetailDto {
  id: string;
  importNumber: number;
  containerNumber: string;
  containerType: number;
  clientId: string;
  clientFullName: string;
  clientTaxId?: string | null;
  driverId?: string | null;
  driver?: DriverDetailDto | null;
  statusId: string;
  statusName: string;
  charge: number;
  createdUtc: string;
  transportation?: TransportationDto | null;
  documents: ImportDocumentDto[];
  importDocumentTypeRequireds: ImportDocumentTypeRequiredDto[];
  payments: ImportPaymentDto[];
  importLogs: ImportLogDto[];
}

export interface TransportationDto {
  id: string;
  importId: string;
  statusId: string;
  statusName: string;
  startDate: string;
  transitDays: number;
}

export enum TransportationTrackingType {
  Seguimiento = 1,
  Estado = 2
}

export interface TransportationTrackingDto {
  id: string;
  transportationId: string;
  message: string;
  userId: string;
  username: string;
  occurredAt: string;
  type: TransportationTrackingType;
}

export interface ImportDocumentDto {
  id: string;
  importDocumentTypeId: string;
  importDocumentTypeName: string;
  originalName: string;
  filesize: number;
  createdUtc: string;
}

export interface ImportDocumentTypeRequiredDto {
  importDocumentTypeId: string;
  importDocumentTypeName: string;
  isRequired: boolean;
  status: number;
  sortOrder: number;
}

export interface ImportPaymentDto {
  id: string;
  amount: number;
  paymentDate: string;
  type: number;
  createdById: string;
  createdByUsername: string;
  importDocumentId?: string | null;
  importDocumentName?: string | null;
  importDocumentType?: string | null;
  notes?: string | null;
}

export interface ImportLogDto {
  id: string;
  action: number;
  message: string;
  actorUserName: string;
  occurredAt: string;
}

export interface ImportLogListItemDto {
  userName: string;
  occurredAt: string;
  message: string;
  action: string;
}

export interface ImportLogsQuery {
  page?: number;
  pageSize?: number;
}

export interface ImportStatusOptionDto {
  id: string;
  name: string;
}

export interface ImportDocumentTypeOptionDto {
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

export interface CreateImportRequest {
  clientId: string;
  containerNumber: string;
  containerType: number;
}

export interface UpdateImportRequest {
  clientId: string;
  driverId: string | null;
  containerNumber: string;
  containerType: number;
}

export interface UpdateImportStatusRequest {
  statusId: string;
}

export interface SaveImportDocumentRequest {
  importDocumentTypeId: string;
  file: File;
}

export interface SaveImportDocumentResponse {
  id: string;
  isStatusUpdated: boolean;
  requiredDocumentStatus?: number | null;
}

export interface DeleteImportDocumentResponse {
  requiredDocumentStatus?: number | null;
}

export interface ApproveImportDocumentTypeResponse {
  isStatusUpdated: boolean;
}

export interface SaveImportPaymentRequest {
  amount: number;
  paymentDate: string;
  type: ImportPaymentType;
  notes?: string;
  importDocumentTypeId?: string;
  document?: File;
}

export interface SaveTransportationRequest {
  statusId: string;
  startDate: string;
  transitDays: number;
}

export interface SaveTransportationTrackingRequest {
  message: string;
  type: TransportationTrackingType;
}

export interface ContainerTypeOption {
  label: string;
  value: number;
}

export const CONTAINER_TYPE_OPTIONS: ContainerTypeOption[] = [
  { label: '20ft', value: 1 },
  { label: '40ft', value: 2 }
];

export const IMPORT_PAYMENT_TYPE_OPTIONS: ImportPaymentTypeOption[] = [
  { label: 'Efectivo', value: ImportPaymentType.Efectivo },
  { label: 'Transferencia', value: ImportPaymentType.Transferencia },
  { label: 'QR', value: ImportPaymentType.QR }
];
