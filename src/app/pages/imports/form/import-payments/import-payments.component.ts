import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { FileSelectorComponent } from '../../../../common-components/file-selector/file-selector.component';
import { formatDateForBackend } from '../../../../functions/common.function';
import { ImportPaymentsFormModel } from '../../models/import-form.models';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import {
  IMPORT_PAYMENT_TYPE_OPTIONS,
  ImportDetailDto,
  ImportDocumentCategory,
  ImportDocumentTypeOptionDto,
  ImportPaymentDto,
  ImportPaymentType,
  ImportPaymentTypeOption,
  SaveImportPaymentRequest
} from '@services/imports/imports.types';
import { ImportsService } from '@services/imports/imports.service';

@Component({
  selector: 'app-import-payments',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    FileSelectorComponent,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TooltipModule
  ],
  templateUrl: './import-payments.component.html',
  styleUrl: './import-payments.component.css'
})
export class ImportPaymentsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly importsService = inject(ImportsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly importId = input.required<string>();
  readonly importItem = input.required<ImportDetailDto>();

  readonly importChanged = output<ImportDetailDto>();

  readonly isSavingPayment = signal(false);
  readonly isLoadingDocumentTypeOptions = signal(false);
  readonly deletingPaymentId = signal<string | null>(null);
  readonly selectedDocumentFile = signal<File | null>(null);
  readonly documentTypeOptions = signal<ImportDocumentTypeOptionDto[]>([]);
  readonly payments = signal<ImportPaymentDto[]>([]);
  readonly paymentTypeOptions = signal<ImportPaymentTypeOption[]>(IMPORT_PAYMENT_TYPE_OPTIONS);
  readonly totalPaid = computed(() => this.payments().reduce((sum, payment) => sum + payment.amount, 0));
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importItem().statusId));

  readonly paymentForm: FormGroup<ImportPaymentsFormModel> = this.formBuilder.group({
    type: this.formBuilder.control<ImportPaymentType | null>(null, [Validators.required]),
    amount: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    paymentDate: this.formBuilder.control<Date | null>(this.getTodayDate(), [Validators.required]),
    notes: this.formBuilder.nonNullable.control(''),
    importDocumentTypeId: this.formBuilder.control<string | null>({ value: null, disabled: true })
  });

  constructor() {
    effect(() => {
      const id = this.importId();
      this.resetPaymentForm();
      this.loadDocumentTypeOptions();
      this.loadInitialPayments(id);
    });

    effect(() => {
      this.syncFormDisabledState();
    });
  }

  onDocumentFileSelected(file: File): void {
    if (this.isReadOnly()) {
      return;
    }

    this.selectedDocumentFile.set(file);
    this.paymentForm.controls.importDocumentTypeId.updateValueAndValidity();
  }

  onDocumentFileCleared(): void {
    if (this.isReadOnly()) {
      return;
    }

    this.selectedDocumentFile.set(null);
    this.paymentForm.controls.importDocumentTypeId.setValue(null);
    this.paymentForm.controls.importDocumentTypeId.updateValueAndValidity();
  }

  onCancel(): void {
    if (this.isReadOnly()) {
      return;
    }

    this.resetPaymentForm();
  }

  onSave(): void {
    if (this.isSavingPayment() || this.isReadOnly()) {
      return;
    }

    this.applyConditionalValidation();

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const id = this.importId();
    const request = this.buildSaveRequest();

    if (!request) {
      return;
    }

    this.isSavingPayment.set(true);
    this.uiBlockService.block();

    this.importsService
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

  onPaymentDownload(payment: ImportPaymentDto): void {
    const importDocumentId = payment.importDocumentId;

    if (!importDocumentId) {
      return;
    }

    this.importsService.downloadDocument(importDocumentId).subscribe({
      next: (file) => {
        const objectUrl = URL.createObjectURL(file);
        const link = globalThis.document.createElement('a');

        link.href = objectUrl;
        link.download = payment.importDocumentName?.trim() || 'comprobante';
        link.click();

        URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        this.appToastService.showServerError('No se pudo descargar el comprobante.');
      }
    });
  }

  onPaymentDelete(payment: ImportPaymentDto): void {
    if (this.isReadOnly()) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el pago${payment.importDocumentName ? ` y su comprobante "${payment.importDocumentName}"` : ''}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deletePayment(payment.id)
    });
  }

  getFieldError(controlName: keyof ImportPaymentsFormModel): string {
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

  getPaymentTypeLabel(type: number): string {
    return this.paymentTypeOptions().find((option) => option.value === type)?.label ?? 'Sin tipo';
  }

  formatAmount(amount: number): string {
    return `Bs ${new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  }

  formatPaymentDate(value: string): string {
    const normalizedValue = value.trim();
    const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!match) {
      return '-';
    }

    const [, year, month, day] = match;

    return `${day}/${month}/${year.slice(-2)}`;
  }

  private loadDocumentTypeOptions(): void {
    this.isLoadingDocumentTypeOptions.set(true);

    this.importsService
      .getDocumentTypeOptions(ImportDocumentCategory.Pagos)
      .pipe(finalize(() => this.isLoadingDocumentTypeOptions.set(false)))
      .subscribe((response) => {
        this.documentTypeOptions.set(response.data ?? []);
      });
  }

  private loadInitialPayments(id: string): void {
    this.importsService.getPayments(id).subscribe((response) => {
      this.payments.set(response.data ?? []);
    });
  }

  private refreshPayments(id: string): void {
    this.importsService.getPayments(id).subscribe((response) => {
      const payments = response.data ?? [];

      this.payments.set(payments);
      this.importChanged.emit({
        ...this.importItem()        
      });
    });
  }

  private deletePayment(paymentId: string): void {
    const id = this.importId();

    this.deletingPaymentId.set(paymentId);
    this.uiBlockService.block();

    this.importsService
      .deletePayment(paymentId)
      .pipe(
        finalize(() => {
          this.deletingPaymentId.set(null);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        this.refreshPayments(id);
      });
  }

  private buildSaveRequest(): SaveImportPaymentRequest | null {
    const formValue = this.paymentForm.getRawValue();

    if (formValue.type === null || formValue.amount === null) {
      return null;
    }

    const request: SaveImportPaymentRequest = {
      type: formValue.type,
      amount: formValue.amount,
      paymentDate: formatDateForBackend(formValue.paymentDate) ?? '',
      notes: formValue.notes.trim() || undefined
    };

    const document = this.selectedDocumentFile();
    const importDocumentTypeId = formValue.importDocumentTypeId;

    if (document && importDocumentTypeId) {
      request.document = document;
      request.importDocumentTypeId = importDocumentTypeId;
    }

    return request;
  }

  private resetPaymentForm(): void {
    this.selectedDocumentFile.set(null);
    this.paymentForm.reset({
      type: null,
      amount: null,
      paymentDate: this.getTodayDate(),
      notes: '',
      importDocumentTypeId: null
    });

    this.clearConditionalValidation();
  }

  private applyConditionalValidation(): void {
    const documentTypeControl = this.paymentForm.controls.importDocumentTypeId;

    if (this.selectedDocumentFile()) {
      documentTypeControl.addValidators(Validators.required);
    } else {
      documentTypeControl.removeValidators(Validators.required);
    }

    documentTypeControl.updateValueAndValidity({ emitEvent: false });
  }

  private clearConditionalValidation(): void {
    const documentTypeControl = this.paymentForm.controls.importDocumentTypeId;
    documentTypeControl.removeValidators(Validators.required);
    documentTypeControl.updateValueAndValidity({ emitEvent: false });
  }

  private syncFormDisabledState(): void {
    if (this.isSavingPayment() || this.isReadOnly()) {
      this.paymentForm.disable({ emitEvent: false });
      return;
    }

    this.paymentForm.enable({ emitEvent: false });

    const documentTypeControl = this.paymentForm.controls.importDocumentTypeId;
    const shouldDisableDocumentType = this.isLoadingDocumentTypeOptions() || !this.selectedDocumentFile();

    if (shouldDisableDocumentType) {
      documentTypeControl.disable({ emitEvent: false });
      return;
    }

    documentTypeControl.enable({ emitEvent: false });
  }

  private getTodayDate(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}
