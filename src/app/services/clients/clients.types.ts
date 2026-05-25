export interface ClientsListQuery {
  page?: number;
  pageSize?: number;
  firstName?: string;
  lastName?: string;
  taxId?: string;
  phone?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: string;
}

export interface ClientListItemDto {
  id: string;
  clientNumber: number;
  fullName: string;
  phone?: string | null;
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

export interface ClientRequest {
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  taxId: string;
  isActive: boolean;
}

export interface ClientOptionDto {
  id: string;
  label: string;
}
