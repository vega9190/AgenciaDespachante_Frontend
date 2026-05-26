export interface ClientsListQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  taxId?: string;
  contactPhone?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: string;
}

export interface ClientListItemDto {
  id: string;
  clientNumber: number;
  companyName: string;
  contactName: string;
  contactPhone?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdUtc: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ClientCreateRequest {
  companyName: string;
  contactName: string;
  address?: string | null;
  contactPhone?: string | null;
  taxId?: string | null;
  isActive: boolean;
}

export interface ClientUpdateRequest extends ClientCreateRequest {
  isActive: boolean;
}

export interface ClientDetailDto {
  id: string;
  clientNumber: number;
  companyName: string;
  contactName: string;
  address?: string | null;
  contactPhone?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdUtc: string;
  updatedUtc?: string | null;
}

export type ClientCreateResponse = string;

export interface ClientOptionDto {
  id: string;
  name: string;
  taxId?: string | null;
}
