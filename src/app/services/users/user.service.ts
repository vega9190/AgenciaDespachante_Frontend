import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildHttpParams } from '../../functions/common.function';
import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  PagedResult,
  UserCreateRequest,
  UserCreateResponse,
  UserDetailDto,
  UserListItemDto,
  UsersListQuery,
  UserUpdateRequest
} from './users.types';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly httpClient = inject(HttpClient);
  private readonly usersUrl = `${environment.apiUrl}/api/Users`;

  create(request: UserCreateRequest) {
    return this.httpClient.post<ApiResultOf<UserCreateResponse>>(this.usersUrl, request);
  }

  update(id: string, request: UserUpdateRequest) {
    return this.httpClient.put<ApiResultOf<null>>(`${this.usersUrl}/${id}`, request);
  }

  getById(id: string) {
    return this.httpClient.get<ApiResultOf<UserDetailDto>>(`${this.usersUrl}/${id}`);
  }

  getList(query: UsersListQuery = {}) {
    return this.httpClient.get<ApiResultOf<PagedResult<UserListItemDto>>>(this.usersUrl, {
      params: buildHttpParams(query)
    });
  }
}
