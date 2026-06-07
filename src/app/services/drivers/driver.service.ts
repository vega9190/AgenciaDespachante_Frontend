import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildHttpParams } from '../../functions/common.function';
import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  DriverCreateRequest,
  DriverCreateResponse,
  DriverDetailDto,
  DriverListItemDto,
  DriverOptionDto,
  DriversListQuery,
  DriverUpdateRequest,
  PagedResult,
  SaveDriverDocumentRequest,
  SaveDriverDocumentResponse
} from './drivers.types';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private readonly httpClient = inject(HttpClient);
  private readonly driversUrl = `${environment.apiUrl}/api/Drivers`;

  create(request: DriverCreateRequest) {
    return this.httpClient.post<ApiResultOf<DriverCreateResponse>>(this.driversUrl, request);
  }

  update(id: string, request: DriverUpdateRequest) {
    return this.httpClient.put<ApiResultOf<null>>(`${this.driversUrl}/${id}`, request);
  }

  getById(id: string) {
    return this.httpClient.get<ApiResultOf<DriverDetailDto>>(`${this.driversUrl}/${id}`);
  }

  getList(query: DriversListQuery = {}) {
    return this.httpClient.get<ApiResultOf<PagedResult<DriverListItemDto>>>(this.driversUrl, {
      params: buildHttpParams(query)
    });
  }

  getOptions(search?: string) {
    return this.httpClient.get<ApiResultOf<DriverOptionDto[]>>(`${this.driversUrl}/options`, {
      params: buildHttpParams({ search })
    });
  }

  saveDocument(id: string, request: SaveDriverDocumentRequest) {
    const formData = new FormData();
    formData.set('isFront', String(request.isFront));
    formData.set('file', request.file);

    return this.httpClient.post<ApiResultOf<SaveDriverDocumentResponse>>(`${this.driversUrl}/${id}/documents`, formData);
  }

  deleteDocument(id: string, isFront: boolean) {
    return this.httpClient.delete<ApiResultOf<null>>(`${this.driversUrl}/${id}/documents`, {
      params: buildHttpParams({ isFront })
    });
  }

  downloadDocument(id: string, isFront: boolean) {
    return this.httpClient.get(`${this.driversUrl}/${id}/documents/file`, {
      params: buildHttpParams({ isFront }),
      responseType: 'blob'
    });
  }
}
