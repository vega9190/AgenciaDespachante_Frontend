import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';

export interface QuotationReportRequest {
  item: string;
  tariffItem: string | null;
  itemPrice: number;
  landFreightPrice: number | null;
  maritimeFreightPrice: number | null;
  assurancePercent: number | null;
  assuranceTotal: number | null;
  gaPercent: number | null;
  gaTotal: number | null;
  ivaPercent: number | null;
  ivaTotal: number | null;
  icePercent: number | null;
  iceTotal: number | null;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly httpClient = inject(HttpClient);
  private readonly reportsUrl = `${environment.apiUrl}/api/reports`;

  downloadDispatchForm(importId: string) {
    return this.httpClient.get(`${this.reportsUrl}/import/${importId}/dispatch-form`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  downloadQuotation(request: QuotationReportRequest) {
    return this.httpClient.post(`${this.reportsUrl}/quotation`, request, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
