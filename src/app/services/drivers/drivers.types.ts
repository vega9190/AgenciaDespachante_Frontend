export interface DriversListQuery {
  page?: number;
  pageSize?: number;
  driverNumber?: number;
  fullName?: string;
  isActive?: boolean;
  isExternal?: boolean;
  sortBy?: string;
  sortDirection?: string;
}

export interface DriverListItemDto {
  id: string;
  driverNumber: number;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  itHasDocument: boolean;
  createdUtc: string;
  isExternal: boolean;
  itExpiresSoon: boolean; 
  isExpired: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DriverCreateRequest {
  name: string;
  lastName: string;
  phoneNumber: string;
  isExternal: boolean;
}

export interface DriverUpdateRequest extends DriverCreateRequest {
  isActive: boolean;
  transportCardExpirationDate?: string | null;
}

export interface DriverDetailDto {
  id: string;
  driverNumber: number;
  name: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  isExternal: boolean;
  isActive: boolean;
  transportCardExpirationDate?: string | null;
  createdUtc: string;
  updatedUtc?: string | null;
}

export type DriverCreateResponse = string;

export interface DriverOptionDto {
  id: string;
  fullName: string;
}

export interface SaveDriverDocumentRequest {
  isFront: boolean;
  file: File;
}

export type SaveDriverDocumentResponse = string;
