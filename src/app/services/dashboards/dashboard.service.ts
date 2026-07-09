import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildHttpParams } from '../../functions/common.function';
import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  DashboardFinancialSummaryDto,
  DashboardLogisticsSummaryDto,
  DashboardSummaryQuery
} from './dashboards.types';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly httpClient = inject(HttpClient);
  private readonly dashboardUrl = `${environment.apiUrl}/api/dashboard`;

  getFinancialSummary(query: DashboardSummaryQuery = {}) {
    return this.httpClient.get<ApiResultOf<DashboardFinancialSummaryDto>>(`${this.dashboardUrl}/financial-summary`, {
      params: buildHttpParams(query)
    });
  }

  getLogisticsSummary(query: DashboardSummaryQuery = {}) {
    return this.httpClient.get<ApiResultOf<DashboardLogisticsSummaryDto>>(`${this.dashboardUrl}/logistics-summary`, {
      params: buildHttpParams(query)
    });
  }
}
