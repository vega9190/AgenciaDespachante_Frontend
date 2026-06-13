import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { buildHttpParams } from '../../functions/common.function';
import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  ApproveImportDocumentTypeResponse,
  CreateImportRequest,
  DeleteImportDocumentResponse,
  GetImportDocumentsResponseDto,
  ImportDetailDto,
  ImportDocumentCategory,
  ImportLogListItemDto,
  ImportLogsQuery,
  ImportDocumentTypeOptionDto,
  ImportListItemDto,
  ImportPaymentDto,
  ImportStatusOptionDto,
  ImportsListQuery,
  PagedResult,
  SaveImportDocumentRequest,
  SaveImportDocumentResponse,
  SaveImportPaymentRequest,
  SaveTransportationRequest,
  SaveTransportationTrackingRequest,
  TransportationDto,
  TransportationTrackingDto,
  UpdateImportRequest,
  UpdateImportStatusRequest
} from './imports.types';

@Injectable({
  providedIn: 'root'
})
export class ImportsService {
  private readonly httpClient = inject(HttpClient);
  private readonly importsUrl = `${environment.apiUrl}/api/Imports`;

  create(request: CreateImportRequest) {
    return this.httpClient.post<ApiResultOf<string>>(this.importsUrl, request);
  }

  update(id: string, request: UpdateImportRequest) {
    return this.httpClient.put<ApiResultOf<null>>(`${this.importsUrl}/${id}`, request);
  }

  updateStatus(id: string, request: UpdateImportStatusRequest) {
    return this.httpClient.put<ApiResultOf<null>>(`${this.importsUrl}/${id}/status`, request);
  }

  getList(query: ImportsListQuery = {}) {
    return this.httpClient.get<ApiResultOf<PagedResult<ImportListItemDto>>>(this.importsUrl, {
      params: buildHttpParams(query)
    });
  }

  getById(id: string) {
    return this.httpClient.get<ApiResultOf<ImportDetailDto>>(`${this.importsUrl}/${id}`);
  }

  getTransportation(id: string) {
    return this.httpClient.get<ApiResultOf<TransportationDto | null>>(`${this.importsUrl}/${id}/transportation`);
  }

  getTransportationTracking(id: string) {
    return this.httpClient.get<ApiResultOf<TransportationTrackingDto[]>>(`${this.importsUrl}/${id}/transportation/tracking`);
  }

  getDocuments(id: string, category?: ImportDocumentCategory) {
    return this.httpClient.get<ApiResultOf<GetImportDocumentsResponseDto>>(`${this.importsUrl}/${id}/documents`, {
      params: buildHttpParams({ category })
    });
  }

  getPayments(id: string) {
    return this.httpClient.get<ApiResultOf<ImportPaymentDto[]>>(`${this.importsUrl}/${id}/payments`);
  }

  getLogs(id: string, query: ImportLogsQuery = {}) {
    return this.httpClient.get<ApiResultOf<PagedResult<ImportLogListItemDto>>>(`${this.importsUrl}/${id}/logs`, {
      params: buildHttpParams(query)
    });
  }

  getStatusOptions() {
    return this.httpClient.get<ApiResultOf<ImportStatusOptionDto[]>>(`${this.importsUrl}/status-options`);
  }

  getDocumentTypeOptions(category?: number) {
    return this.httpClient.get<ApiResultOf<ImportDocumentTypeOptionDto[]>>(`${this.importsUrl}/documents/type-options`, {
      params: buildHttpParams({ category })
    });
  }

  getDocumentTypeOptionsByImportId(id: string) {
    return this.httpClient.get<ApiResultOf<ImportDocumentTypeOptionDto[]>>(`${this.importsUrl}/${id}/documents/type-options`);
  }

  saveDocument(id: string, request: SaveImportDocumentRequest) {
    const formData = new FormData();
    formData.set('importDocumentTypeId', request.importDocumentTypeId);
    formData.set('file', request.file);

    return this.httpClient.post<ApiResultOf<SaveImportDocumentResponse>>(`${this.importsUrl}/${id}/documents`, formData);
  }

  approveDocumentType(id: string, importDocumentTypeId: string) {
    return this.httpClient.put<ApiResultOf<ApproveImportDocumentTypeResponse>>(`${this.importsUrl}/${id}/documents/type/${importDocumentTypeId}/approve`, null);
  }

  savePayment(id: string, request: SaveImportPaymentRequest) {
    const formData = new FormData();
    formData.set('amount', String(request.amount));
    formData.set('paymentDate', request.paymentDate);
    formData.set('type', String(request.type));

    if (request.notes) {
      formData.set('notes', request.notes);
    }

    if (request.importDocumentTypeId) {
      formData.set('importDocumentTypeId', request.importDocumentTypeId);
    }

    if (request.document) {
      formData.set('document', request.document);
    }

    return this.httpClient.post<ApiResultOf<string>>(`${this.importsUrl}/${id}/payments`, formData);
  }

  saveTransportation(id: string, request: SaveTransportationRequest) {
    return this.httpClient.post<ApiResultOf<string>>(`${this.importsUrl}/${id}/transportation`, request);
  }

  saveTransportationTracking(id: string, request: SaveTransportationTrackingRequest) {
    return this.httpClient.post<ApiResultOf<string>>(`${this.importsUrl}/${id}/transportation/tracking`, request);
  }

  downloadDocument(documentId: string) {
    return this.httpClient.get(`${this.importsUrl}/documents/${documentId}`, {
      responseType: 'blob'
    });
  }

  deleteDocument(documentId: string) {
    return this.httpClient.delete<ApiResultOf<DeleteImportDocumentResponse>>(`${this.importsUrl}/documents/${documentId}`);
  }

  deletePayment(paymentId: string) {
    return this.httpClient.delete<ApiResultOf<null>>(`${this.importsUrl}/payments/${paymentId}`);
  }

  getStatusOptionsByImportId(id: string) {
    return this.httpClient.get(`${this.importsUrl}/${id}/status-options`);
  }
}
