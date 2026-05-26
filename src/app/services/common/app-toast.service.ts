import { Injectable, inject } from '@angular/core';

import { MessageService } from 'primeng/api';

import { ApiResult, MessageLevelType, MessageResult } from '@models/api.types';

type ToastSeverity = 'info' | 'warn' | 'success' | 'error';

@Injectable({
  providedIn: 'root'
})
export class AppToastService {
  private readonly messageService = inject(MessageService);

  showApiMessages(result: ApiResult | null | undefined): void {
    if (!result?.messageList?.length) {
      return;
    }

    this.showMessages(result.messageList);
  }

  showMessages(messages: MessageResult[]): void {
    const toastMessages = messages
      .filter((message) => !!message.description?.trim())
      .map((message) => ({
        severity: this.mapSeverity(message.type),
        summary: this.mapSummary(message.type),
        detail: message.description.trim(),
        life: 3000
      }));

    if (toastMessages.length === 0) {
      return;
    }

    this.messageService.addAll(toastMessages);
  }

  showServerError(message = 'Ocurrió un error interno del servidor.'): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000
    });
  }

  private mapSeverity(type: number): ToastSeverity {
    switch (type) {
      case MessageLevelType.Warning:
        return 'warn';
      case MessageLevelType.Success:
        return 'success';
      case MessageLevelType.Error:
        return 'error';
      case MessageLevelType.Info:
      default:
        return 'info';
    }
  }

  private mapSummary(type: number): string {
    switch (type) {
      case MessageLevelType.Warning:
        return 'Advertencia';
      case MessageLevelType.Success:
        return 'Éxito';
      case MessageLevelType.Error:
        return 'Error';
      case MessageLevelType.Info:
      default:
        return 'Información';
    }
  }
}
