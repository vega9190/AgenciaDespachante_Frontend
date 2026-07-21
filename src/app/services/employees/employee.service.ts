import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildHttpParams } from '../../functions/common.function';
import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  EmployeeCreateResponse,
  EmployeeDetailDto,
  EmployeeListItemDto,
  EmployeeOptionDto,
  EmployeeRequest,
  EmployeesListQuery,
  PagedResult
} from './employees.types';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly httpClient = inject(HttpClient);
  private readonly employeesUrl = `${environment.apiUrl}/api/Employees`;

  create(request: EmployeeRequest) {
    return this.httpClient.post<ApiResultOf<EmployeeCreateResponse>>(this.employeesUrl, request);
  }

  update(id: string, request: EmployeeRequest) {
    return this.httpClient.put<ApiResultOf<null>>(`${this.employeesUrl}/${id}`, request);
  }

  getById(id: string) {
    return this.httpClient.get<ApiResultOf<EmployeeDetailDto>>(`${this.employeesUrl}/${id}`);
  }

  getList(query: EmployeesListQuery = {}) {
    return this.httpClient.get<ApiResultOf<PagedResult<EmployeeListItemDto>>>(this.employeesUrl, {
      params: buildHttpParams(query)
    });
  }

  getOptions(search?: string, excludeUserAssigned?: boolean) {
    return this.httpClient.get<ApiResultOf<EmployeeOptionDto[]>>(`${this.employeesUrl}/options`, {
      params: buildHttpParams({ search, excludeUserAssigned })
    });
  }
}
