import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  ClientCreateRequest,
  ClientCreateResponse,
  ClientDetailDto,
  ClientListItemDto,
  ClientOptionDto,
  ClientsListQuery,
  ClientUpdateRequest,
  PagedResult
} from './clients.types';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private readonly httpClient = inject(HttpClient);
  private readonly clientsUrl = `${environment.apiUrl}/api/Clients`;

  create(request: ClientCreateRequest) {
    return this.httpClient.post<ApiResultOf<ClientCreateResponse>>(this.clientsUrl, request);
  }

  update(id: string, request: ClientUpdateRequest) {
    return this.httpClient.put<ApiResultOf<null>>(`${this.clientsUrl}/${id}`, request);
  }

  getById(id: string) {
    return this.httpClient.get<ApiResultOf<ClientDetailDto>>(`${this.clientsUrl}/${id}`);
  }

  getList(query: ClientsListQuery = {}) {
    return this.httpClient.get<ApiResultOf<PagedResult<ClientListItemDto>>>(this.clientsUrl, {
      params: buildHttpParams(query)
    });
  }

  getOptions(search?: string) {
    return this.httpClient.get<ApiResultOf<ClientOptionDto[]>>(`${this.clientsUrl}/options`, {
      params: buildHttpParams({ search })
    });
  }
}

function buildHttpParams<T extends object>(query: T): HttpParams {
  let params = new HttpParams();

  for (const [key, value] of Object.entries(query) as Array<[string, string | number | boolean | null | undefined]>) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    params = params.set(key, String(value));
  }

  return params;
}
