import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';

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
}
