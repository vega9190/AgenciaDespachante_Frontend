import { DatePipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ImageSingleSelectorComponent } from '../../../common-components/image-single-selector/image-single-selector.component';
import { AppPhoneInputComponent } from '../../../common-components/phone-input/phone-input.component';
import {
  DriverDocumentSide,
  DriverDocumentsState,
  DriverDocumentVm,
  DriverFormModel,
  DriverTypeOption
} from '../models/driver-form.models';
import { formatDateForBackend } from '../../../functions/common.function';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { DriverService } from '@services/drivers/driver.service';
import { DriverCreateRequest, DriverDetailDto, DriverUpdateRequest } from '@services/drivers/drivers.types';

@Component({
  selector: 'app-driver-form',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    AppPhoneInputComponent,
    ImageSingleSelectorComponent
  ],
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.css'
})
export class DriverFormComponent implements OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly driverService = inject(DriverService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appToastService = inject(AppToastService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly driverTypeOptions: DriverTypeOption[] = [
    { label: 'Interno', value: false },
    { label: 'Externo', value: true }
  ];

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly driver = signal<DriverDetailDto | null>(null);
  readonly driverId = signal<string | null>(null);
  readonly driverDocuments = signal<DriverDocumentsState>({
    front: this.createEmptyDocumentState(),
    back: this.createEmptyDocumentState()
  });
  readonly frontDocument = computed(() => this.driverDocuments().front);
  readonly backDocument = computed(() => this.driverDocuments().back);
  readonly hasAnyDocument = computed(() => this.documentExists(this.frontDocument()) || this.documentExists(this.backDocument()));
  readonly isEditMode = computed(() => this.driverId() !== null);
  readonly pageTitle = computed(() => {
    if (!this.isEditMode()) {
      return 'Crear Chofer';
    }

    const driverNumber = this.driver()?.driverNumber;
    return `Editar Chofer - #${driverNumber}`;
  });

  readonly driverForm: FormGroup<DriverFormModel> = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    lastName: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    phoneNumber: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(9)]),
    isExternal: this.formBuilder.control<boolean | null>(null, [Validators.required]),
    isActive: this.formBuilder.nonNullable.control(true),
    transportCardExpirationDate: this.formBuilder.control<Date | null>({ value: null, disabled: true })
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');

      this.resetDocuments();
      this.driverId.set(id);

      if (id) {
        this.loadDriver(id);
        return;
      }

      this.driver.set(null);
      this.driverForm.reset({
        name: '',
        lastName: '',
        phoneNumber: '',
        isExternal: null,
        isActive: true,
        transportCardExpirationDate: null
      });
      this.syncTransportCardExpirationControlState();
    });
  }

  ngOnDestroy(): void {
    this.resetDocuments();
  }

  onSubmit(): void {
    if (this.driverForm.invalid || this.isSaving()) {
      this.driverForm.markAllAsTouched();
      return;
    }

    if (!this.validateBeforeSubmit()) {
      return;
    }

    if (this.isEditMode()) {
      this.updateDriver();
      return;
    }

    this.createDriver();
  }

  onCancel(): void {
    void this.router.navigate(['/drivers']);
  }

  onDocumentSelected(side: DriverDocumentSide, file: File): void {
    const id = this.driverId();

    if (!id || this.getDocumentState(side).isLoading) {
      return;
    }

    this.setDocumentLoading(side, true);
    this.uiBlockService.block();

    this.driverService
      .saveDocument(id, { isFront: this.isFrontSide(side), file })
      .pipe(
        finalize(() => {
          this.setDocumentLoading(side, false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe({
        next: (response) => {
          this.appToastService.showApiMessages(response);

          if (!this.isSuccessfulResponse(response)) {
            return;
          }

          this.loadDocument(id, side);
        },
        error: () => {
          this.appToastService.showServerError('No se pudo guardar la imagen.');
        }
      });
  }

  onDocumentDownload(side: DriverDocumentSide): void {
    const document = this.getDocumentState(side);

    if (!document.blob || !document.fileName) {
      return;
    }

    const objectUrl = URL.createObjectURL(document.blob);
    const link = globalThis.document.createElement('a');

    link.href = objectUrl;
    link.download = document.fileName;
    link.click();

    URL.revokeObjectURL(objectUrl);
  }

  onDocumentDelete(side: DriverDocumentSide): void {
    const id = this.driverId();
    const document = this.getDocumentState(side);

    if (!id || document.isLoading || !this.documentExists(document)) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el archivo "${document.fileName ?? 'seleccionado'}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteDocument(side, id)
    });
  }

  private deleteDocument(side: DriverDocumentSide, id: string): void {
    const document = this.getDocumentState(side);

    if (document.isLoading || !this.documentExists(document)) {
      return;
    }

    this.setDocumentLoading(side, true);
    this.uiBlockService.block();

    this.driverService
      .deleteDocument(id, this.isFrontSide(side))
      .pipe(
        finalize(() => {
          this.setDocumentLoading(side, false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe({
        next: (response) => {
          this.appToastService.showApiMessages(response);

          if (!this.isSuccessfulResponse(response)) {
            return;
          }

          this.clearDocument(side);
        },
        error: () => {
          this.appToastService.showServerError('No se pudo eliminar la imagen.');
        }
      });
  }

  getFieldError(controlName: keyof DriverFormModel): string {
    const control = this.driverForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      if (controlName === 'transportCardExpirationDate') {
        return 'Debe ingresar la fecha de expiración cuando exista una Tarjeta de Operación adjunta.';
      }

      return 'Este campo es obligatorio.';
    }

    if (control.hasError('maxlength')) {
      return 'El valor ingresado supera el largo permitido.';
    }

    if (control.hasError('minlength')) {
      return 'El telefono debe tener el formato 710-12345.';
    }

    return '';
  }

  private loadDriver(id: string): void {
    this.isLoading.set(true);

    this.driverService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        const driver = response.data;
        this.driver.set(driver);

        if (!driver) {
          return;
        }

        const transportCardExpirationDate =
          driver.transportCardExpirationDate ??
          (driver as DriverDetailDto & { TransportCardExpirationDate?: string | null }).TransportCardExpirationDate ??
          null;

        this.driverForm.reset({
          name: driver.name,
          lastName: driver.lastName,
          phoneNumber: this.formatPhone(driver.phoneNumber),
          isExternal: driver.isExternal,
          isActive: driver.isActive,
          transportCardExpirationDate: this.parseDateValue(transportCardExpirationDate)
        });

        this.syncTransportCardExpirationControlState(false);

        this.loadDriverDocuments(id);
      });
  }

  private loadDriverDocuments(id: string): void {
    this.loadDocument(id, 'front');
    this.loadDocument(id, 'back');
  }

  private loadDocument(id: string, side: DriverDocumentSide): void {
    this.setDocumentLoading(side, true);

    this.driverService
      .downloadDocument(id, this.isFrontSide(side))
      .pipe(finalize(() => this.setDocumentLoading(side, false)))
      .subscribe({
        next: async (response) => {
          if (this.driverId() !== id) {
            return;
          }

          const blob = response.body;

          if (!blob) {
            this.clearDocument(side, false);
            return;
          }

          const contentType = (response.headers.get('content-type') ?? blob.type).toLowerCase();

          if (contentType.includes('application/json') || contentType.includes('text/plain')) {
            const apiResponse = await this.parseBlobApiResponse(blob);

            if (!apiResponse?.isValid) {
              this.clearDocument(side, false);
              return;
            }

            this.appToastService.showServerError('No se pudo interpretar el documento del chofer.');
            return;
          }

          this.setDocument(side, {
            blob,
            fileName: this.getDownloadFileName(response.headers.get('content-disposition'), side),
            imageUrl: URL.createObjectURL(blob),
            isLoading: false
          });
        },
        error: () => {
          if (this.driverId() !== id) {
            return;
          }

          this.clearDocument(side, false);
          this.appToastService.showServerError('No se pudo cargar la imagen del documento.');
        }
      });
  }

  private createDriver(): void {
    const request = this.buildCreateRequest();
    this.isSaving.set(true);
    this.uiBlockService.block();

    this.driverService
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

        void this.router.navigate(['/drivers', response.data]);
      });
  }

  private updateDriver(): void {
    const id = this.driverId();

    if (!id) {
      return;
    }

    const request = this.buildUpdateRequest();
    this.isSaving.set(true);
    this.uiBlockService.block();

    this.driverService
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

        this.driver.update((current) =>
          current
            ? {
                ...current,
                ...request,
                fullName: `${request.name} ${request.lastName}`,
                phoneNumber: request.phoneNumber
              }
            : current
        );
      });
  }

  private buildCreateRequest(): DriverCreateRequest {
    const formValue = this.driverForm.getRawValue();

    return {
      name: formValue.name.trim(),
      lastName: formValue.lastName.trim(),
      phoneNumber: this.normalizePhoneDigits(formValue.phoneNumber),
      isExternal: !!formValue.isExternal
    };
  }

  private buildUpdateRequest(): DriverUpdateRequest {
    const formValue = this.driverForm.getRawValue();

    return {
      ...this.buildCreateRequest(),
      isActive: formValue.isActive,
      transportCardExpirationDate: formatDateForBackend(formValue.transportCardExpirationDate)
    };
  }

  private validateBeforeSubmit(): boolean {
    if (!this.isEditMode()) {
      return true;
    }

    const wantsActive = this.driverForm.controls.isActive.value;
    const hasAnyDocument = this.hasAnyDocument();
    const expirationControl = this.driverForm.controls.transportCardExpirationDate;

    expirationControl.markAsTouched();
    expirationControl.updateValueAndValidity();

    if (wantsActive && !hasAnyDocument) {
      this.appToastService.showServerError('Debe subir su Tarjeta de Operación para activar al chofer.');
      return false;
    }

    if (hasAnyDocument && expirationControl.invalid) {
      return false;
    }

    return true;
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }

  private createEmptyDocumentState(): DriverDocumentVm {
    return {
      fileName: null,
      imageUrl: null,
      blob: null,
      isLoading: false
    };
  }

  private getDocumentState(side: DriverDocumentSide): DriverDocumentVm {
    return this.driverDocuments()[side];
  }

  private setDocumentLoading(side: DriverDocumentSide, isLoading: boolean): void {
    this.driverDocuments.update((current) => ({
      ...current,
      [side]: {
        ...current[side],
        isLoading
      }
    }));
  }

  private setDocument(side: DriverDocumentSide, document: DriverDocumentVm): void {
    this.driverDocuments.update((current) => {
      this.revokeDocumentUrl(current[side].imageUrl);

      return {
        ...current,
        [side]: document
      };
    });

    this.syncTransportCardExpirationControlState();
  }

  private clearDocument(side: DriverDocumentSide, clearExpirationDateWhenNoDocument = true): void {
    this.driverDocuments.update((current) => {
      this.revokeDocumentUrl(current[side].imageUrl);

      return {
        ...current,
        [side]: {
          ...this.createEmptyDocumentState(),
          isLoading: current[side].isLoading
        }
      };
    });

    this.syncTransportCardExpirationControlState(clearExpirationDateWhenNoDocument);
  }

  private resetDocuments(): void {
    const currentDocuments = this.driverDocuments();

    this.revokeDocumentUrl(currentDocuments.front.imageUrl);
    this.revokeDocumentUrl(currentDocuments.back.imageUrl);
    this.driverDocuments.set({
      front: this.createEmptyDocumentState(),
      back: this.createEmptyDocumentState()
    });

    this.syncTransportCardExpirationControlState();
  }

  private syncTransportCardExpirationControlState(clearValueWhenNoDocument = true): void {
    const control = this.driverForm.controls.transportCardExpirationDate;

    if (this.hasAnyDocument()) {
      control.setValidators([Validators.required]);
      control.enable({ emitEvent: false });
    } else {
      control.clearValidators();

      if (clearValueWhenNoDocument) {
        control.setValue(null, { emitEvent: false });
      }

      control.markAsPristine();
      control.markAsUntouched();
      control.disable({ emitEvent: false });
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private documentExists(document: DriverDocumentVm): boolean {
    return !!document.blob || !!document.imageUrl || !!document.fileName;
  }

  private revokeDocumentUrl(imageUrl: string | null): void {
    if (!imageUrl) {
      return;
    }

    URL.revokeObjectURL(imageUrl);
  }

  private isFrontSide(side: DriverDocumentSide): boolean {
    return side === 'front';
  }

  private async parseBlobApiResponse(blob: Blob): Promise<ApiResult | null> {
    try {
      return JSON.parse(await blob.text()) as ApiResult;
    } catch {
      return null;
    }
  }

  private getDownloadFileName(contentDisposition: string | null, side: DriverDocumentSide): string {
    const encodedFileName = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];

    if (encodedFileName) {
      return decodeURIComponent(encodedFileName);
    }

    const plainFileName = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]?.trim();

    if (plainFileName) {
      return plainFileName;
    }

    return side === 'front' ? 'tarjeta-operacion-anverso.jpg' : 'tarjeta-operacion-reverso.jpg';
  }

  private normalizePhoneDigits(value: string): string {
    return value.replace(/\D+/g, '').slice(0, 8);
  }

  private formatPhone(value: string): string {
    const digits = this.normalizePhoneDigits(value);

    if (digits.length <= 3) {
      return digits;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  private parseDateValue(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

}
