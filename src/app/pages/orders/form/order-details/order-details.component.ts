import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ApiResult, ApiResultOf } from '@models/api.types';
import { ClientsService } from '@services/clients/clients.service';
import { ClientOptionDto } from '@services/clients/clients.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { ContainerTypeOption, CreateOrderRequest, OrderDetailDto, UpdateOrderRequest } from '@services/orders/orders.types';
import { OrdersService } from '@services/orders/orders.service';

interface OrderDetailsFormModel {
  client: FormControl<ClientOptionDto | null>;
  containerNumber: FormControl<string>;
  containerType: FormControl<number | null>;
}

@Component({
  selector: 'app-order-details',
  imports: [ReactiveFormsModule, AutoCompleteModule, ButtonModule, CardModule, InputTextModule, SelectModule],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly orderId = input<string | null>(null);
  readonly order = input<OrderDetailDto | null>(null);
  readonly containerTypeOptions = input.required<ContainerTypeOption[]>();
  readonly isLoadingOrder = input(false);

  readonly orderChanged = output<OrderDetailDto>();

  readonly isSaving = signal(false);
  readonly isLoadingClients = signal(false);
  readonly clientSuggestions = signal<ClientOptionDto[]>([]);

  readonly orderForm: FormGroup<OrderDetailsFormModel> = this.formBuilder.group({
    client: this.formBuilder.control<ClientOptionDto | null>(null, [Validators.required]),
    containerNumber: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    containerType: this.formBuilder.control<number | null>(null, [Validators.required])
  });

  constructor() {
    effect(() => {
      const orderId = this.orderId();
      const currentOrder = this.order();

      if (!orderId) {
        this.orderForm.reset({
          client: null,
          containerNumber: '',
          containerType: null
        });
        this.loadClientSuggestions();
        return;
      }

      if (!currentOrder) {
        return;
      }

      const selectedClient = this.mapOrderClient(currentOrder);
      this.clientSuggestions.set(this.mergeClientOption(selectedClient, this.clientSuggestions()));

      this.orderForm.reset({
        client: selectedClient,
        containerNumber: currentOrder.containerNumber,
        containerType: currentOrder.containerType
      });
    });
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

  onCancel(): void {
    void this.router.navigate(['/orders']);
  }

  onSubmit(): void {
    if (this.orderForm.invalid || this.isSaving()) {
      this.orderForm.markAllAsTouched();
      return;
    }

    if (this.orderId()) {
      this.updateOrder();
      return;
    }

    this.createOrder();
  }

  getFieldError(controlName: keyof OrderDetailsFormModel): string {
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
    const request = this.buildUpdateRequest();

    if (!id || !request) {
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

        this.refreshOrder(id);
      });
  }

  private refreshOrder(id: string): void {
    this.ordersService.getById(id).subscribe((response) => {
      if (!response.data) {
        return;
      }

      this.orderChanged.emit(response.data);
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

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}
