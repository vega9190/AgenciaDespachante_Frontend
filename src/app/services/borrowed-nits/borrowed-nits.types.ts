export interface BorrowedNitsListQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  nit?: string;
  isActive?: boolean | null;
  sortBy?: string;
  sortDirection?: string;
}

export interface BorrowedNitRequest {
  id?: string | null;
  name: string;
  nit: string;
  isActive: boolean;
}

export interface BorrowedNitListItemDto {
  id: string;
  name: string;
  nit: string;
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
