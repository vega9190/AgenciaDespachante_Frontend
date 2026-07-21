export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface UsersListQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  roleId?: string;
  isActive?: boolean;
  employeeId?: string;
  clientId?: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface UserCreateRequest {
  employeeId?: string | null;
  clientId?: string | null;
  username: string;
  password: string;
  roleId: string;
  isActive: boolean;
}

export interface UserUpdateRequest {
  username: string;
  roleId: string;
  isActive: boolean;
  password?: string | null;
}

export interface UserListItemDto {
  id: string;
  username: string;
  roleName: string;
  isActive: boolean;
  displayName: string;
  createdUtc: string;
  employeeId?: string | null;
  clientId?: string | null;
}

export interface UserDetailDto {
  id: string;
  username: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  employeeId?: string | null;
  clientId?: string | null;
  displayName: string;
  createdUtc: string;
  updatedUtc?: string | null;
}

export type UserCreateResponse = string;
