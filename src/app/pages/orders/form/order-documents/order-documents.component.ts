import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { FileSelectorComponent } from '../../../../common-components/file-selector/file-selector.component';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { OrderDetailDto, OrderDocumentTypeOptionDto } from '@services/orders/orders.types';
import { OrdersService } from '@services/orders/orders.service';

import { DocumentSectionItem, DocumentSectionVm } from '../order-form.types';

const DOCUMENT_STATUS = {
  aprobado: 1,
  enRevision: 2,
  faltante: 3
} as const;

@Component({
  selector: 'app-order-documents',
  imports: [FormsModule, AccordionModule, ButtonModule, CardModule, SelectModule, TagModule, TooltipModule, FileSelectorComponent],
  templateUrl: './order-documents.component.html',
  styleUrl: './order-documents.component.css'
})
export class OrderDocumentsComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly orderId = input.required<string>();
  readonly order = input.required<OrderDetailDto>();

  readonly orderChanged = output<OrderDetailDto>();

  readonly isLoadingDocumentTypes = signal(false);
  readonly isSavingDocument = signal(false);
  readonly documentTypeOptions = signal<OrderDocumentTypeOptionDto[]>([]);
  readonly selectedDocumentTypeId = signal<string | null>(null);
  readonly selectedDocumentFile = signal<File | null>(null);
  readonly approveConfirmDocumentTypeId = signal<string | null>(null);
  readonly approvingDocumentTypeId = signal<string | null>(null);

  readonly canSaveDocument = computed(
    () => !!this.orderId() && !!this.selectedDocumentTypeId() && !!this.selectedDocumentFile() && !this.isSavingDocument() && !this.isLoadingDocumentTypes()
  );
  readonly documentSections = computed<DocumentSectionVm[]>(() => {
    const currentOrder = this.order();
    const approveConfirmDocumentTypeId = this.approveConfirmDocumentTypeId();
    const approvingDocumentTypeId = this.approvingDocumentTypeId();

    return this.getSortedRequiredDocumentTypes(currentOrder.orderDocumentTypeRequireds).map((required) => {
      const documents = currentOrder.documents
        .filter((document) => document.orderDocumentTypeId === required.orderDocumentTypeId)
        .map((document) => ({
          id: document.id,
          name: document.originalName,
          icon: this.getDocumentFileIcon(document.originalName),
          orderDocumentTypeId: document.orderDocumentTypeId,
          sizeLabel: this.getDocumentSizeLabel(document.filesize),
          uploadedAtLabel: this.getDocumentDateLabel(document.createdUtc)
        }));

      const documentsCount = documents.length;
      const isApproved = required.status === DOCUMENT_STATUS.aprobado;
      const canApprove = required.status === DOCUMENT_STATUS.enRevision;

      return {
        orderDocumentTypeId: required.orderDocumentTypeId,
        title: required.orderDocumentTypeName,
        status: required.status,
        statusLabel: this.getDocumentStatusLabel(required.status),
        statusSeverity: this.getDocumentStatusSeverity(required.status),
        statusIcon: this.getDocumentStatusIcon(required.status),
        documentsCount,
        documentsCountLabel: this.getDocumentCountLabel(documentsCount),
        documents,
        isDisabled: documentsCount === 0,
        showRequiredText: required.isRequired && documentsCount === 0,
        showStatus: required.status !== DOCUMENT_STATUS.faltante || required.isRequired,
        isApproved,
        canApprove,
        isApproveConfirmOpen: approveConfirmDocumentTypeId === required.orderDocumentTypeId,
        isApproving: approvingDocumentTypeId === required.orderDocumentTypeId
      };
    });
  });
  readonly documentSectionActiveValue = computed(() => {
    const sections = this.documentSections();
    const firstEnabledSection = sections.find((section) => !section.isDisabled);
    return firstEnabledSection?.orderDocumentTypeId ?? sections[0]?.orderDocumentTypeId ?? null;
  });

  constructor() {
    effect(() => {
      this.orderId();
      this.loadDocumentTypeOptions();
      this.resetDocumentForm();
    });
  }

  onDocumentTypeChange(documentTypeId: string | null): void {
    this.selectedDocumentTypeId.set(documentTypeId);
  }

  onDocumentFileSelected(file: File): void {
    this.selectedDocumentFile.set(file);
  }

  onDocumentFileCleared(): void {
    this.selectedDocumentFile.set(null);
  }

  onDocumentCancel(): void {
    this.resetDocumentForm();
  }

  onDocumentSave(): void {
    const id = this.orderId();
    const orderDocumentTypeId = this.selectedDocumentTypeId();
    const file = this.selectedDocumentFile();

    if (!orderDocumentTypeId || !file || this.isSavingDocument()) {
      return;
    }

    this.isSavingDocument.set(true);
    this.uiBlockService.block();

    this.ordersService
      .saveDocument(id, { orderDocumentTypeId, file })
      .pipe(
        finalize(() => {
          this.isSavingDocument.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        this.resetDocumentForm();
        this.refreshOrder(id);
      });
  }

  onDocumentDownload(document: DocumentSectionItem): void {
    this.ordersService.downloadDocument(document.id).subscribe({
      next: (file) => {
        const objectUrl = URL.createObjectURL(file);
        const link = globalThis.document.createElement('a');

        link.href = objectUrl;
        link.download = document.name;
        link.click();

        URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        this.appToastService.showServerError('No se pudo descargar el documento.');
      }
    });
  }

  onDocumentDelete(document: DocumentSectionItem): void {
    const id = this.orderId();

    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el archivo "${document.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteDocument(id, document)
    });
  }

  onApproveBadgeClick(orderDocumentTypeId: string, canApprove: boolean, event: Event): void {
    event.stopPropagation();

    if (!canApprove || this.approvingDocumentTypeId()) {
      return;
    }

    this.approveConfirmDocumentTypeId.update((current) => (current === orderDocumentTypeId ? null : orderDocumentTypeId));
  }

  onApproveConfirmYes(orderDocumentTypeId: string, event: Event): void {
    event.stopPropagation();

    const id = this.orderId();

    if (this.approvingDocumentTypeId()) {
      return;
    }

    this.approvingDocumentTypeId.set(orderDocumentTypeId);

    this.ordersService
      .approveDocumentType(id, orderDocumentTypeId)
      .pipe(
        finalize(() => {
          this.approvingDocumentTypeId.set(null);
          this.approveConfirmDocumentTypeId.set(null);
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        this.refreshOrder(id);
      });
  }

  onApproveConfirmNo(event: Event): void {
    event.stopPropagation();
    this.approveConfirmDocumentTypeId.set(null);
  }

  trackByDocumentSection(_: number, section: DocumentSectionVm): string {
    return section.orderDocumentTypeId;
  }

  trackByDocumentItem(_: number, document: DocumentSectionItem): string {
    return document.id;
  }

  private deleteDocument(id: string, document: DocumentSectionItem): void {
    this.uiBlockService.block();

    this.ordersService
      .deleteDocument(document.id)
      .pipe(finalize(() => this.uiBlockService.unblock()))
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        this.refreshOrder(id);
      });
  }

  private refreshOrder(id: string): void {
    this.ordersService.getById(id).subscribe((response) => {
      if (!response.data) {
        return;
      }

      this.orderChanged.emit(response.data);
      this.loadDocumentTypeOptions();
    });
  }

  private loadDocumentTypeOptions(): void {
    const id = this.orderId();

    this.isLoadingDocumentTypes.set(true);

    this.ordersService
      .getDocumentTypeOptionsByOrderId(id)
      .pipe(finalize(() => this.isLoadingDocumentTypes.set(false)))
      .subscribe((response) => {
        this.documentTypeOptions.set(response.data ?? []);
      });
  }

  private resetDocumentForm(): void {
    this.selectedDocumentTypeId.set(null);
    this.selectedDocumentFile.set(null);
    this.approveConfirmDocumentTypeId.set(null);
  }

  private getDocumentStatusLabel(status: number): string {
    switch (status) {
      case DOCUMENT_STATUS.aprobado:
        return 'Aprobado';
      case DOCUMENT_STATUS.enRevision:
        return 'En revisión';
      case DOCUMENT_STATUS.faltante:
        return 'Faltante';
      default:
        return 'Sin estado';
    }
  }

  private getDocumentStatusSeverity(status: number): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case DOCUMENT_STATUS.aprobado:
        return 'success';
      case DOCUMENT_STATUS.enRevision:
        return 'warn';
      case DOCUMENT_STATUS.faltante:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  private getDocumentStatusIcon(status: number): string {
    switch (status) {
      case DOCUMENT_STATUS.aprobado:
        return 'pi pi-check';
      case DOCUMENT_STATUS.enRevision:
        return 'pi pi-clock';
      case DOCUMENT_STATUS.faltante:
        return 'pi pi-exclamation-circle';
      default:
        return 'pi pi-info-circle';
    }
  }

  private getDocumentCountLabel(count: number): string {
    return count === 1 ? '1 archivo' : `${count} archivos`;
  }

  private getDocumentFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.trim().toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'pi pi-file-pdf';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'pi pi-file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp':
      case 'svg':
        return 'pi pi-image';
      default:
        return 'pi pi-file';
    }
  }

  private getSortedRequiredDocumentTypes(requireds: OrderDetailDto['orderDocumentTypeRequireds']): OrderDetailDto['orderDocumentTypeRequireds'] {
    const sortBySortOrder = (left: { sortOrder: number }, right: { sortOrder: number }) => left.sortOrder - right.sortOrder;
    const requiredDocuments = requireds.filter((required) => required.isRequired).sort(sortBySortOrder);
    const optionalDocuments = requireds.filter((required) => !required.isRequired).sort(sortBySortOrder);

    return [...requiredDocuments, ...optionalDocuments];
  }

  private getDocumentSizeLabel(filesize: number): string {
    if (filesize < 1024) {
      return `${filesize} B`;
    }

    const sizeInKb = filesize / 1024;

    if (sizeInKb < 1024) {
      return `${Math.round(sizeInKb)} KB`;
    }

    return `${(sizeInKb / 1024).toFixed(1)} MB`;
  }

  private getDocumentDateLabel(createdUtc: string): string {
    const date = new Date(createdUtc);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}
