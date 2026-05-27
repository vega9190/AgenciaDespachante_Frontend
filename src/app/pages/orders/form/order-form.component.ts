import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

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

interface OrderFormModel {
  client: FormControl<ClientOptionDto | null>;
  containerNumber: FormControl<string>;
  containerType: FormControl<number | null>;
}

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, FormsModule, DatePipe, AutoCompleteModule, ButtonModule, CardModule, InputTextModule, SelectModule, Tabs, TabList, Tab, TabPanels, TabPanel, FileSelectorComponent],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly clientsService = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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
  readonly containerTypeOptions = CONTAINER_TYPE_OPTIONS;
  readonly orderTimelineSteps = ORDER_TIMELINE_STEPS;
  readonly activeEditTab = signal('details');
  readonly isEditMode = computed(() => this.orderId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Pedido' : 'Crear Pedido'));
  readonly canSaveDocument = computed(
    () => !!this.orderId() && !!this.selectedDocumentTypeId() && !!this.selectedDocumentFile() && !this.isSavingDocument() && !this.isLoadingDocumentTypes()
  );

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

        if (response.data?.isStatusUpdated) {
          this.loadOrder(id);
          this.loadDocumentTypeOptions(id);
        }
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

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}
