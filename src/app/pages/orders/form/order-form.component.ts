import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AccordionModule } from 'primeng/accordion';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';

import { FileSelectorComponent } from '../../../common-components/file-selector/file-selector.component';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { ClientsService } from '@services/clients/clients.service';
import { ClientOptionDto } from '@services/clients/clients.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { ORDER_STATUS_IDS, ORDER_TIMELINE_STEPS } from '@services/orders/order-status.constants';
import {
  CONTAINER_TYPE_OPTIONS,
  ContainerTypeOption,
  CreateOrderRequest,
  OrderDocumentTypeOptionDto,
  OrderDetailDto,
  UpdateOrderRequest
} from '@services/orders/orders.types';
import { OrdersService } from '@services/orders/orders.service';

interface DocumentSectionItem {
  id: string;
  name: string;
  icon: string;
  orderDocumentTypeId: string;
  sizeLabel: string;
  uploadedAtLabel: string;
}

interface DocumentSectionVm {
  orderDocumentTypeId: string;
  title: string;
  status: number;
  statusLabel: string;
  statusSeverity: 'success' | 'warn' | 'danger' | 'secondary';
  statusIcon: string;
  documentsCount: number;
  documentsCountLabel: string;
  documents: DocumentSectionItem[];
  isDisabled: boolean;
  showRequiredText: boolean;
  showStatus: boolean;
  isApproved: boolean;
  canApprove: boolean;
  isApproveConfirmOpen: boolean;
  isApproving: boolean;
}

const DOCUMENT_STATUS = {
  aprobado: 1,
  enRevision: 2,
  faltante: 3
} as const;

interface OrderFormModel {
  client: FormControl<ClientOptionDto | null>;
  containerNumber: FormControl<string>;
  containerType: FormControl<number | null>;
}

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, FormsModule, DatePipe, AccordionModule, AutoCompleteModule, ButtonModule, CardModule, ConfirmDialogModule, InputTextModule, SelectModule, TagModule, Tabs, TabList, Tab, TabPanels, TabPanel, TooltipModule, FileSelectorComponent],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly clientsService = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isLoadingClients = signal(false);
  readonly isLoadingDocumentTypes = signal(false);
  readonly isSavingDocument = signal(false);
  readonly order = signal<OrderDetailDto | null>(null);
  readonly orderId = signal<string | null>(null);
  readonly clientSuggestions = signal<ClientOptionDto[]>([]);
  readonly documentTypeOptions = signal<OrderDocumentTypeOptionDto[]>([]);
  readonly selectedDocumentTypeId = signal<string | null>(null);
  readonly selectedDocumentFile = signal<File | null>(null);
  readonly approveConfirmDocumentTypeId = signal<string | null>(null);
  readonly approvingDocumentTypeId = signal<string | null>(null);
  readonly containerTypeOptions = CONTAINER_TYPE_OPTIONS;
  readonly orderTimelineSteps = ORDER_TIMELINE_STEPS;
  readonly activeEditTab = signal('details');
  readonly isEditMode = computed(() => this.orderId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Pedido' : 'Crear Pedido'));
  readonly canSaveDocument = computed(
    () => !!this.orderId() && !!this.selectedDocumentTypeId() && !!this.selectedDocumentFile() && !this.isSavingDocument() && !this.isLoadingDocumentTypes()
  );
  readonly documentSections = computed<DocumentSectionVm[]>(() => {
    const currentOrder = this.order();
    const approveConfirmDocumentTypeId = this.approveConfirmDocumentTypeId();
    const approvingDocumentTypeId = this.approvingDocumentTypeId();

    if (!currentOrder) {
      return [];
    }

    return this.getSortedRequiredDocumentTypes(currentOrder.orderDocumentTypeRequireds)
      .map((required) => {
        const documents = currentOrder.documents
          .filter((document) => document.orderDocumentTypeId === required.orderDocumentTypeId)
          .map((document, documentIndex) => ({
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

  readonly orderForm: FormGroup<OrderFormModel> = this.formBuilder.group({
    client: this.formBuilder.control<ClientOptionDto | null>(null, [Validators.required]),
    containerNumber: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    containerType: this.formBuilder.control<number | null>(null, [Validators.required])
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      this.orderId.set(id);

      if (id) {
        this.resetDocumentForm();
        this.loadOrder(id);
        this.loadDocuments(id);
        this.loadDocumentTypeOptions(id);
        return;
      }

      this.order.set(null);
      this.documentTypeOptions.set([]);
      this.resetDocumentForm();
      this.orderForm.reset({
        client: null,
        containerNumber: '',
        containerType: null
      });
      this.loadClientSuggestions();
    });
  }

  onSubmit(): void {
    if (this.orderForm.invalid || this.isSaving()) {
      this.orderForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode()) {
      this.updateOrder();
      return;
    }

    this.createOrder();
  }

  onCancel(): void {
    void this.router.navigate(['/orders']);
  }

  onClientSearch(event: AutoCompleteCompleteEvent): void {
    const search = typeof event.query === 'string' ? event.query.trim() : '';

    if (search.length > 0 && search.length < 3) {
      return;
    }

    this.loadClientSuggestions(search || undefined);
  }

  onClientDropdownClick(): void {
    this.loadClientSuggestions();
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

    if (!id || !orderDocumentTypeId || !file || this.isSavingDocument()) {
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

        this.loadDocuments(id);
        this.loadDocumentTypeOptions(id);
        this.updateRequiredDocumentStatus(orderDocumentTypeId, response.data?.requiredDocumentStatus ?? null);

        if (response.data?.isStatusUpdated) {
          this.loadOrder(id);
        }
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

    if (!id) {
      return;
    }

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

  onApproveConfirmNo(event: Event): void {
    event.stopPropagation();
    this.approveConfirmDocumentTypeId.set(null);
  }

  onApproveConfirmYes(orderDocumentTypeId: string, event: Event): void {
    event.stopPropagation();

    const id = this.orderId();

    if (!id || this.approvingDocumentTypeId()) {
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
        this.updateRequiredDocumentStatus(orderDocumentTypeId, DOCUMENT_STATUS.aprobado);

        if (response.data?.isStatusUpdated) {
          this.loadOrder(id);
          this.loadDocumentTypeOptions(id);
        }
      });
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

        this.loadDocuments(id);
        this.loadDocumentTypeOptions(id);
        this.updateRequiredDocumentStatus(document.orderDocumentTypeId, response.data?.requiredDocumentStatus ?? null);
      });
  }

  getFieldError(controlName: keyof OrderFormModel): string {
    const control = this.orderForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('maxlength')) {
      return 'El valor ingresado supera el largo permitido.';
    }

    return '';
  }

  getCurrentTimelineStepIndex(statusId: string | null | undefined): number {
    if (!statusId || this.isCancelledStatus(statusId)) {
      return -1;
    }

    const normalizedStatusId = statusId.toLowerCase();
    return this.orderTimelineSteps.findIndex((step) => step.statusId.toLowerCase() === normalizedStatusId);
  }

  isCompletedTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return currentStepIndex > -1 && stepIndex < currentStepIndex;
  }

  isCurrentTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return currentStepIndex > -1 && stepIndex === currentStepIndex;
  }

  trackByDocumentSection(_: number, section: DocumentSectionVm): string {
    return section.orderDocumentTypeId;
  }

  trackByDocumentItem(_: number, document: DocumentSectionItem): string {
    return document.id;
  }

  getTimelineConnectorState(stepIndex: number, currentStepIndex: number): 'completed' | 'pending' {
    return currentStepIndex > stepIndex ? 'completed' : 'pending';
  }

  private isCancelledStatus(statusId: string): boolean {
    return statusId.toLowerCase() === ORDER_STATUS_IDS.cancelado.toLowerCase();
  }

  private loadOrder(id: string): void {
    this.isLoading.set(true);

    this.ordersService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        const order = response.data;
        this.order.set(order);

        if (!order) {
          return;
        }

        const selectedClient = this.mapOrderClient(order);
        this.clientSuggestions.set(this.mergeClientOption(selectedClient, this.clientSuggestions()));

        this.orderForm.reset({
          client: selectedClient,
          containerNumber: order.containerNumber,
          containerType: order.containerType
        });
      });
  }

  private loadDocumentTypeOptions(id: string): void {
    this.isLoadingDocumentTypes.set(true);

    this.ordersService
      .getDocumentTypeOptionsByOrderId(id)
      .pipe(finalize(() => this.isLoadingDocumentTypes.set(false)))
      .subscribe((response) => {        
        this.documentTypeOptions.set(response.data ?? []);
      });
  }

  private loadDocuments(id: string): void {
    this.ordersService.getDocuments(id).subscribe((response) => {
      const documents = response.data ?? [];

      this.order.update((current) =>
        current
          ? {
              ...current,
              documents
            }
          : current
      );
    });
  }

  private createOrder(): void {
    const request = this.buildCreateRequest();

    if (!request) {
      return;
    }

    this.isSaving.set(true);
    this.uiBlockService.block();

    this.ordersService
      .create(request)
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response) || !response.data) {
          return;
        }

        void this.router.navigate(['/orders', response.data]);
      });
  }

  private updateOrder(): void {
    const id = this.orderId();

    if (!id) {
      return;
    }

    const request = this.buildUpdateRequest();

    if (!request) {
      return;
    }

    this.isSaving.set(true);
    this.uiBlockService.block();

    this.ordersService
      .update(id, request)
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        this.order.update((current) =>
          current
            ? {
                ...current,
                ...request,
                clientFullName: request.clientId === current.clientId ? current.clientFullName : this.orderForm.controls.client.value?.name ?? current.clientFullName
              }
            : current
        );
      });
  }

  private buildCreateRequest(): CreateOrderRequest | null {
    const formValue = this.orderForm.getRawValue();

    if (!formValue.client || formValue.containerType === null) {
      return null;
    }

    return {
      clientId: formValue.client.id,
      containerNumber: formValue.containerNumber.trim(),
      containerType: formValue.containerType
    };
  }

  private buildUpdateRequest(): UpdateOrderRequest | null {
    return this.buildCreateRequest();
  }

  private loadClientSuggestions(search?: string): void {
    this.isLoadingClients.set(true);

    this.clientsService
      .getOptions(search)
      .pipe(finalize(() => this.isLoadingClients.set(false)))
      .subscribe((response) => {
        const selectedClient = this.orderForm.controls.client.value;
        this.clientSuggestions.set(this.mergeClientOption(selectedClient, response.data ?? []));
      });
  }

  private mapOrderClient(order: OrderDetailDto): ClientOptionDto {
    return {
      id: order.clientId,
      name: order.clientFullName,
      taxId: order.clientTaxId
    };
  }

  private mergeClientOption(selectedClient: ClientOptionDto | null, options: ClientOptionDto[]): ClientOptionDto[] {
    if (!selectedClient) {
      return options;
    }

    const hasSelectedClient = options.some((option) => option.id === selectedClient.id);

    if (hasSelectedClient) {
      return options;
    }

    return [selectedClient, ...options];
  }

  private resetDocumentForm(): void {
    this.selectedDocumentTypeId.set(null);
    this.selectedDocumentFile.set(null);
  }

  private updateRequiredDocumentStatus(orderDocumentTypeId: string, requiredDocumentStatus: number | null): void {
    if (requiredDocumentStatus === null) {
      return;
    }

    this.order.update((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        orderDocumentTypeRequireds: current.orderDocumentTypeRequireds.map((required) =>
          required.orderDocumentTypeId === orderDocumentTypeId
            ? {
                ...required,
                status: requiredDocumentStatus
              }
            : required
        )
      };
    });
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
