import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildHttpParams } from '../../functions/common.function';
import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  BorrowedNitRequest,
  BorrowedNitsListQuery,
  BorrowedNitListItemDto,
  PagedResult
} from './borrowed-nits.types';

@Injectable({
  providedIn: 'root'
})
export class BorrowedNitsService {
  private readonly httpClient = inject(HttpClient);
  private readonly borrowedNitsUrl = `${environment.apiUrl}/api/BorrowedNits`;

  save(request: BorrowedNitRequest) {
    return this.httpClient.post<ApiResultOf<string>>(this.borrowedNitsUrl, request);
  }

  getList(query: BorrowedNitsListQuery = {}) {
    return this.httpClient.get<ApiResultOf<PagedResult<BorrowedNitListItemDto>>>(this.borrowedNitsUrl, {
      params: buildHttpParams(query)
    });
  }
}
