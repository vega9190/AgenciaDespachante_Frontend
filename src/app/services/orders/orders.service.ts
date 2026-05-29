import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { ApiResult, ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  ApproveOrderDocumentTypeResponse,
  ContainerTypeOption,
  CreateOrderRequest,
  DeleteOrderDocumentResponse,
  OrderDocumentDto,
  OrderDocumentCategory,
  OrderDocumentTypeOptionDto,
  OrderDetailDto,
  OrderListItemDto,
  OrderPaymentDto,
  OrderStatusOptionDto,
  OrdersListQuery,
  PagedResult,
  SaveOrderDocumentRequest,
  SaveOrderDocumentResponse,
  SaveOrderPaymentRequest,
  UpdateOrderRequest,
  UpdateOrderStatusRequest
} from './orders.types';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly httpClient = inject(HttpClient);
  private readonly ordersUrl = `${environment.apiUrl}/api/Orders`;

  create(request: CreateOrderRequest) {
    return this.httpClient.post<ApiResultOf<string>>(this.ordersUrl, request);
  }

  update(id: string, request: UpdateOrderRequest) {
    return this.httpClient.put<ApiResultOf<null>>(`${this.ordersUrl}/${id}`, request);
  }

  updateStatus(id: string, request: UpdateOrderStatusRequest) {
    return this.httpClient.put(`${this.ordersUrl}/${id}/status`, request);
  }

  getList(query: OrdersListQuery = {}) {
    return this.httpClient.get<ApiResultOf<PagedResult<OrderListItemDto>>>(this.ordersUrl, {
      params: buildHttpParams(query)
    });
  }

  getById(id: string) {
    return this.httpClient.get<ApiResultOf<OrderDetailDto>>(`${this.ordersUrl}/${id}`);
  }

  getDocuments(id: string, category?: OrderDocumentCategory) {
    return this.httpClient.get<ApiResultOf<OrderDocumentDto[]>>(`${this.ordersUrl}/${id}/documents`, {
      params: buildHttpParams({ category })
    });
  }

  getPayments(id: string) {
    return this.httpClient.get<ApiResultOf<OrderPaymentDto[]>>(`${this.ordersUrl}/${id}/payments`);
  }

  getStatusOptions() {
    return this.httpClient.get<ApiResultOf<OrderStatusOptionDto[]>>(`${this.ordersUrl}/status-options`);
  }

  getDocumentTypeOptions(category?: number) {
    return this.httpClient.get<ApiResultOf<OrderDocumentTypeOptionDto[]>>(`${this.ordersUrl}/documents/type-options`, {
      params: buildHttpParams({ category })
    });
  }

  getDocumentTypeOptionsByOrderId(id: string) {
    return this.httpClient.get<ApiResultOf<OrderDocumentTypeOptionDto[]>>(`${this.ordersUrl}/${id}/documents/type-options`);
  }

  saveDocument(id: string, request: SaveOrderDocumentRequest) {
    const formData = new FormData();
    formData.set('orderDocumentTypeId', request.orderDocumentTypeId);
    formData.set('file', request.file);

    return this.httpClient.post<ApiResultOf<SaveOrderDocumentResponse>>(`${this.ordersUrl}/${id}/documents`, formData);
  }

  approveDocumentType(id: string, orderDocumentTypeId: string) {
    return this.httpClient.put<ApiResultOf<ApproveOrderDocumentTypeResponse>>(`${this.ordersUrl}/${id}/documents/type/${orderDocumentTypeId}/approve`, null);
  }

  savePayment(id: string, request: SaveOrderPaymentRequest) {
    const formData = new FormData();
    formData.set('amount', String(request.amount));
    formData.set('paymentDate', request.paymentDate);
    formData.set('type', String(request.type));

    if (request.notes) {
      formData.set('notes', request.notes);
    }

    if (request.orderDocumentTypeId) {
      formData.set('orderDocumentTypeId', request.orderDocumentTypeId);
    }

    if (request.document) {
      formData.set('document', request.document);
    }

    return this.httpClient.post<ApiResultOf<string>>(`${this.ordersUrl}/${id}/payments`, formData);
  }

  downloadDocument(documentId: string) {
    return this.httpClient.get(`${this.ordersUrl}/documents/${documentId}`, {
      responseType: 'blob'
    });
  }

  deleteDocument(documentId: string) {
    return this.httpClient.delete<ApiResultOf<DeleteOrderDocumentResponse>>(`${this.ordersUrl}/documents/${documentId}`);
  }

  deletePayment(paymentId: string) {
    return this.httpClient.delete(`${this.ordersUrl}/payments/${paymentId}`);
  }

  getStatusOptionsByOrderId(id: string) {
    return this.httpClient.get(`${this.ordersUrl}/${id}/status-options`);
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
