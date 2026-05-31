import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  AiPythonArancelBatchResponseDto,
  AiPythonArancelClassifyResponseDto,
  ClassifyArancelBatchRequest,
  ClassifyArancelRequest,
  ProcessAiOcrRequest,
  ProcessBolOcrResponseDto,
  ProcessInvoiceOcrResponseDto
} from './ai.types';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly httpClient = inject(HttpClient);
  private readonly aiUrl = `${environment.apiUrl}/api/Ai`;

  processInvoice(request: ProcessAiOcrRequest) {
    const formData = new FormData();
    formData.set('file', request.file);

    return this.httpClient.post<ApiResultOf<ProcessInvoiceOcrResponseDto>>(`${this.aiUrl}/ocr/invoice`, formData);
  }

  processBol(request: ProcessAiOcrRequest) {
    const formData = new FormData();
    formData.set('file', request.file);

    return this.httpClient.post<ApiResultOf<ProcessBolOcrResponseDto>>(`${this.aiUrl}/ocr/bol`, formData);
  }

  classifyArancel(request: ClassifyArancelRequest) {
    return this.httpClient.post<ApiResultOf<AiPythonArancelClassifyResponseDto>>(`${this.aiUrl}/arancel/classify`, request);
  }

  classifyArancelBatch(request: ClassifyArancelBatchRequest) {
    return this.httpClient.post<ApiResultOf<AiPythonArancelBatchResponseDto>>(`${this.aiUrl}/arancel/classify-batch`, request);
  }
}
