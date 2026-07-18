export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface EmployeesListQuery {
  page?: number;
  pageSize?: number;
  name?: string;
  nationalId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: string;
}

export interface EmployeeRequest {
  firstName: string;
  lastName: string;
  address?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  isActive: boolean;
}

export interface EmployeeListItemDto {
  id: string;
  employeeNumber: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  nationalId?: string | null;
  isActive: boolean;
  createdUtc: string;
}

export interface EmployeeDetailDto {
  id: string;
  employeeNumber: number;
  firstName: string;
  lastName: string;
  address?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  isActive: boolean;
  createdUtc: string;
  updatedUtc?: string | null;
}

export interface EmployeeOptionDto {
  id: string;
  name: string;
}

export type EmployeeCreateResponse = string;
