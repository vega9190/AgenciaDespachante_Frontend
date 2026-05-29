import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { FileSelectorComponent } from '../../../../common-components/file-selector/file-selector.component';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import {
  ORDER_PAYMENT_TYPE_OPTIONS,
  OrderDetailDto,
  OrderDocumentCategory,
  OrderDocumentTypeOptionDto,
  OrderPaymentDto,
  OrderPaymentType,
  OrderPaymentTypeOption,
  SaveOrderPaymentRequest
} from '@services/orders/orders.types';
import { OrdersService } from '@services/orders/orders.service';

interface OrderPaymentsFormModel {
  type: FormControl<OrderPaymentType | null>;
  amount: FormControl<number | null>;
  paymentDate: FormControl<string>;
  notes: FormControl<string>;
  orderDocumentTypeId: FormControl<string | null>;
}

@Component({
  selector: 'app-order-payments',
  imports: [ReactiveFormsModule, ButtonModule, CardModule, FileSelectorComponent, InputNumberModule, InputTextModule, SelectModule],
  templateUrl: './order-payments.component.html',
  styleUrl: './order-payments.component.css'
})
export class OrderPaymentsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly orderId = input.required<string>();
  readonly order = input.required<OrderDetailDto>();

  readonly orderChanged = output<OrderDetailDto>();

  readonly isSavingPayment = signal(false);
  readonly isLoadingDocumentTypeOptions = signal(false);
  readonly selectedDocumentFile = signal<File | null>(null);
  readonly documentTypeOptions = signal<OrderDocumentTypeOptionDto[]>([]);
  readonly payments = signal<OrderPaymentDto[]>([]);
  readonly paymentTypeOptions = signal<OrderPaymentTypeOption[]>(ORDER_PAYMENT_TYPE_OPTIONS);

  readonly paymentForm: FormGroup<OrderPaymentsFormModel> = this.formBuilder.group({
    type: this.formBuilder.control<OrderPaymentType | null>(null, [Validators.required]),
    amount: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    paymentDate: this.formBuilder.nonNullable.control(this.getTodayDateValue()),
    notes: this.formBuilder.nonNullable.control(''),
    orderDocumentTypeId: this.formBuilder.control<string | null>({ value: null, disabled: true })
  });

  constructor() {
    effect(() => {
      this.orderId();
      this.payments.set(this.order().payments);
      this.resetPaymentForm();
      this.loadDocumentTypeOptions();
    });

    effect(() => {
      this.syncFormDisabledState();
    });
  }

  onDocumentFileSelected(file: File): void {
    this.selectedDocumentFile.set(file);
    this.paymentForm.controls.orderDocumentTypeId.updateValueAndValidity();
  }

  onDocumentFileCleared(): void {
    this.selectedDocumentFile.set(null);
    this.paymentForm.controls.orderDocumentTypeId.setValue(null);
    this.paymentForm.controls.orderDocumentTypeId.updateValueAndValidity();
  }

  onCancel(): void {
    this.resetPaymentForm();
  }

  onSave(): void {
    if (this.isSavingPayment()) {
      return;
    }

    this.applyConditionalValidation();

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const id = this.orderId();
    const request = this.buildSaveRequest();

    if (!request) {
      return;
    }

    this.isSavingPayment.set(true);
    this.uiBlockService.block();

    this.ordersService
      .savePayment(id, request)
      .pipe(
        finalize(() => {
          this.isSavingPayment.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        this.resetPaymentForm();
        this.refreshPayments(id);
      });
  }

  getFieldError(controlName: keyof OrderPaymentsFormModel): string {
    const control = this.paymentForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('min')) {
      return 'El monto debe ser mayor a 0.';
    }

    return '';
  }

  private loadDocumentTypeOptions(): void {
    this.isLoadingDocumentTypeOptions.set(true);

    this.ordersService
      .getDocumentTypeOptions(OrderDocumentCategory.Pagos)
      .pipe(finalize(() => this.isLoadingDocumentTypeOptions.set(false)))
      .subscribe((response) => {
        this.documentTypeOptions.set(response.data ?? []);
      });
  }

  private refreshPayments(id: string): void {
    this.ordersService.getPayments(id).subscribe((response) => {
      if (!response.data) {
        return;
      }

      this.payments.set(response.data);
    });
  }

  private buildSaveRequest(): SaveOrderPaymentRequest | null {
    const formValue = this.paymentForm.getRawValue();

    if (formValue.type === null || formValue.amount === null) {
      return null;
    }

    const request: SaveOrderPaymentRequest = {
      type: formValue.type,
      amount: formValue.amount,
      paymentDate: this.toIsoDateTime(formValue.paymentDate),
      notes: formValue.notes.trim() || undefined
    };

    const document = this.selectedDocumentFile();
    const orderDocumentTypeId = formValue.orderDocumentTypeId;

    if (document && orderDocumentTypeId) {
      request.document = document;
      request.orderDocumentTypeId = orderDocumentTypeId;
    }

    return request;
  }

  private resetPaymentForm(): void {
    this.selectedDocumentFile.set(null);
    this.paymentForm.reset({
      type: null,
      amount: null,
      paymentDate: this.getTodayDateValue(),
      notes: '',
      orderDocumentTypeId: null
    });

    this.clearConditionalValidation();
  }

  private applyConditionalValidation(): void {
    const documentTypeControl = this.paymentForm.controls.orderDocumentTypeId;

    if (this.selectedDocumentFile()) {
      documentTypeControl.addValidators(Validators.required);
    } else {
      documentTypeControl.removeValidators(Validators.required);
    }

    documentTypeControl.updateValueAndValidity({ emitEvent: false });
  }

  private clearConditionalValidation(): void {
    const documentTypeControl = this.paymentForm.controls.orderDocumentTypeId;
    documentTypeControl.removeValidators(Validators.required);
    documentTypeControl.updateValueAndValidity({ emitEvent: false });
  }

  private syncFormDisabledState(): void {
    if (this.isSavingPayment()) {
      this.paymentForm.disable({ emitEvent: false });
      return;
    }

    this.paymentForm.enable({ emitEvent: false });

    const documentTypeControl = this.paymentForm.controls.orderDocumentTypeId;
    const shouldDisableDocumentType = this.isLoadingDocumentTypeOptions() || !this.selectedDocumentFile();

    if (shouldDisableDocumentType) {
      documentTypeControl.disable({ emitEvent: false });
      return;
    }

    documentTypeControl.enable({ emitEvent: false });
  }

  private getTodayDateValue(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private toIsoDateTime(value: string): string {
    return `${value}T00:00:00`;
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}
