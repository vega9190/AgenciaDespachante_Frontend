import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { ApiResult, ApiResultOf } from '@models/api.types';
import { formatDateForBackend } from '../../../../functions/common.function';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import { AuthService } from '@core/auth/auth.service';
import { RoleIds } from '@core/auth/role.constants';
import {
  SaveTransportationRequest,
  SaveTransportationTrackingRequest,
  TransportationDto,
  TransportationTrackingDto,
  TransportationTrackingType
} from '@services/imports/imports.types';
import { DriverDetailDto } from '@services/drivers/drivers.types';
import { ImportsService } from '@services/imports/imports.service';
import { ResponsiveTableDirective } from '../../../../common-components/responsive-table/responsive-table.directive';

interface TransportationStatusOption {
  label: string;
  value: string;
}

interface TransportationTimelineStep extends TransportationStatusOption {
  legend: string;
}

interface TransportationFormModel {
  startDate: Date | null;
  statusId: string;
}

interface TransportationTrackingFormModel {
  message: string;
  ubicacion: string;
}

@Component({
  selector: 'app-import-transportation',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TooltipModule,
    ResponsiveTableDirective
  ],
  templateUrl: './import-transportation.component.html',
  styleUrl: './import-transportation.component.css'
})
export class ImportTransportationComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly importsService = inject(ImportsService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly authService = inject(AuthService);

  readonly importId = input.required<string>();
  readonly importStatusId = input.required<string>();
  readonly driver = input<DriverDetailDto | null>(null);

  readonly tracking = signal<TransportationTrackingDto[]>([]);
  readonly isLoadingTransportation = signal(false);
  readonly isLoadingTracking = signal(false);
  readonly isSavingTransportation = signal(false);
  readonly isSavingTracking = signal(false);
  readonly transitDays = signal(0);
  readonly savedTransportationStatusId = signal<string>(TRANSPORTATION_STATUS_IDS.enRutaAlDestino);
  readonly trackingType = TransportationTrackingType;
  readonly transportationTimelineSteps = TRANSPORTATION_STATUS_FLOW;
  readonly canSaveTracking = computed(() => {
    return !!this.transportationStartDate() && !this.isSavingTracking() && !this.isReadOnly();
  });

  readonly statusOptions = computed(() => this.buildStatusOptions(this.savedTransportationStatusId()));
  readonly transportationTimelineStepIndex = computed(() => this.getCurrentTimelineStepIndex(this.savedTransportationStatusId()));
  readonly transportationTimelineLegend = computed(() => {
    const currentStep = TRANSPORTATION_STATUS_FLOW.find(
      (status) => status.value.toLowerCase() === this.savedTransportationStatusId().toLowerCase()
    );

    return currentStep?.legend ?? null;
  });
  readonly isTransportationLocked = computed(() => {
    const currentStatusId = this.savedTransportationStatusId().toLowerCase();
    return currentStatusId === TRANSPORTATION_STATUS_IDS.finalizado.toLowerCase();
  });
  readonly canManageImports = computed(() => this.authService.hasRole(RoleIds.Administrator, RoleIds.Manager));
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importStatusId()) || !this.canManageImports());

  readonly mapDialogVisible = signal(false);
  readonly mapDialogEmbedUrl = signal<SafeResourceUrl | null>(null);
  readonly mapDialogExternalUrl = signal<string | null>(null);
  private readonly transportationStartDate = signal<Date | null>(null);

  readonly transportationForm: FormGroup = this.formBuilder.group({
    startDate: this.formBuilder.control<Date | null>(null, [Validators.required]),
    statusId: this.formBuilder.nonNullable.control(TRANSPORTATION_STATUS_IDS.enRutaAlDestino, [Validators.required])
  });

  readonly trackingForm: FormGroup = this.formBuilder.group({
    message: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(500)]),
    ubicacion: this.formBuilder.nonNullable.control('', [httpsUrlValidator])
  });

  constructor() {
    effect(() => {
      const importId = this.importId();

      this.loadTransportation(importId);
      this.loadTracking(importId);
    });

    effect(() => {
      this.syncTransportationFormDisabledState();
      this.syncTrackingFormDisabledState();
    });

    this.transportationForm.controls.startDate.valueChanges.subscribe((value) => {
      this.transportationStartDate.set(value);
    });
  }

  onSaveTransportation(): void {
    if (this.isSavingTransportation() || this.transportationForm.invalid || this.isTransportationLocked() || this.isReadOnly()) {
      this.transportationForm.markAllAsTouched();
      return;
    }

    const request = this.buildSaveTransportationRequest();

    if (!request) {
      return;
    }

    this.isSavingTransportation.set(true);
    this.uiBlockService.block();

    this.importsService
      .saveTransportation(this.importId(), request)
      .pipe(
        finalize(() => {
          this.isSavingTransportation.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        const normalizedStatusId = this.normalizeTransportationStatusId(request.statusId);

        this.savedTransportationStatusId.set(normalizedStatusId);
        this.transportationForm.controls.statusId.setValue(normalizedStatusId, { emitEvent: false });
        this.loadTransportation(this.importId());
        this.loadTracking(this.importId());
      });
  }

  onSaveTracking(): void {
    if (!this.canSaveTracking()) {
      return;
    }

    if (this.trackingForm.invalid) {
      this.trackingForm.markAllAsTouched();
      return;
    }

    const rawUbicacion = this.trackingForm.controls.ubicacion.value?.trim();

    const request: SaveTransportationTrackingRequest = {
      message: this.trackingForm.controls.message.value.trim(),
      type: TransportationTrackingType.Seguimiento,
      ubicacion: rawUbicacion ? rawUbicacion : null
    };

    this.isSavingTracking.set(true);
    this.uiBlockService.block();

    this.importsService
      .saveTransportationTracking(this.importId(), request)
      .pipe(
        finalize(() => {
          this.isSavingTracking.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        this.trackingForm.reset({ message: '', ubicacion: '' });
        this.loadTracking(this.importId());
      });
  }

  getTrackingTypeLabel(type: TransportationTrackingType): string {
    return type === TransportationTrackingType.Estado ? 'Estado' : 'Seguimiento';
  }

  getTransportationFieldError(controlName: keyof TransportationFormModel): string {
    const control = this.transportationForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    return '';
  }

  getTrackingFieldError(controlName: keyof TransportationTrackingFormModel): string {
    const control = this.trackingForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('maxlength')) {
      return 'Máximo 500 caracteres.';
    }

    if (control.hasError('httpsUrl')) {
      return 'Debe ser un enlace de Google Maps que comience con https.';
    }

    return '';
  }

  hasCoordinates(item: TransportationTrackingDto): boolean {
    return item.latitude != null && item.longitude != null;
  }

  openMapDialog(item: TransportationTrackingDto): void {
    if (!this.hasCoordinates(item)) {
      return;
    }

    const lat = item.latitude;
    const lng = item.longitude;
    const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=17&hl=es&output=embed`;
    const externalUrl = `https://www.google.com/maps?q=${lat},${lng}&z=17&hl=es`;

    this.mapDialogEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
    this.mapDialogExternalUrl.set(externalUrl);
    this.mapDialogVisible.set(true);
  }

  onMapDialogHide(): void {
    this.mapDialogVisible.set(false);
    this.mapDialogEmbedUrl.set(null);
    this.mapDialogExternalUrl.set(null);
  }

  formatOccurredAt(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  getCurrentTimelineStepIndex(statusId: string | null | undefined): number {
    const normalizedStatusId = this.normalizeTransportationStatusId(statusId).toLowerCase();
    return TRANSPORTATION_STATUS_FLOW.findIndex((step) => step.value.toLowerCase() === normalizedStatusId);
  }

  isCompletedTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return currentStepIndex > -1 && stepIndex < currentStepIndex;
  }

  isCurrentTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return currentStepIndex > -1 && stepIndex === currentStepIndex;
  }

  isFinalizedTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return stepIndex === TRANSPORTATION_STATUS_FLOW.length - 1
      && currentStepIndex === stepIndex
      && this.savedTransportationStatusId().toLowerCase() === TRANSPORTATION_STATUS_IDS.finalizado.toLowerCase();
  }

  getTimelineConnectorState(stepIndex: number, currentStepIndex: number): 'completed' | 'pending' {
    return currentStepIndex > stepIndex ? 'completed' : 'pending';
  }

  hasDriverWhatsappPhone(): boolean {
    return !!this.getDriverWhatsappPhone();
  }

  openDriverWhatsapp(): void {
    const phoneNumber = this.getDriverWhatsappPhone();

    if (!phoneNumber) {
      return;
    }

    window.open(`https://wa.me/${phoneNumber}`, '_blank', 'noopener,noreferrer');
  }

  private syncTransportationForm(transportation: TransportationDto | null | undefined): void {
    const normalizedStatusId = this.normalizeTransportationStatusId(transportation?.statusId);
    const startDate = this.parseDateOnly(transportation?.startDate ?? null);

    this.transitDays.set(transportation?.transitDays ?? 0);
    this.savedTransportationStatusId.set(normalizedStatusId);
    this.transportationForm.reset({ startDate, statusId: normalizedStatusId }, { emitEvent: false });
    this.transportationStartDate.set(startDate);
  }

  private syncTransportationFormDisabledState(): void {
    if (this.isLoadingTransportation() || this.isSavingTransportation() || this.isTransportationLocked() || this.isReadOnly()) {
      this.transportationForm.disable({ emitEvent: false });
      return;
    }

    this.transportationForm.enable({ emitEvent: false });
  }

  private syncTrackingFormDisabledState(): void {
    if (this.isSavingTracking() || this.isReadOnly()) {
      this.trackingForm.disable({ emitEvent: false });
      return;
    }

    this.trackingForm.enable({ emitEvent: false });
  }

  private buildSaveTransportationRequest(): SaveTransportationRequest | null {
    const formValue = this.transportationForm.getRawValue();

    if (!formValue.startDate || !formValue.statusId) {
      return null;
    }

    return {
      startDate: formatDateForBackend(formValue.startDate) ?? '',
      statusId: formValue.statusId,
      transitDays: this.transitDays()
    };
  }

  private loadTracking(importId: string): void {
    this.isLoadingTracking.set(true);

    this.importsService
      .getTransportationTracking(importId)
      .pipe(finalize(() => this.isLoadingTracking.set(false)))
      .subscribe((response) => {
        this.tracking.set(response.data ?? []);
      });
  }

  private loadTransportation(importId: string): void {
    this.isLoadingTransportation.set(true);

    this.importsService
      .getTransportation(importId)
      .pipe(finalize(() => this.isLoadingTransportation.set(false)))
      .subscribe((response) => {
        this.syncTransportationForm(response.data);
      });
  }

  private buildStatusOptions(savedStatusId: string): TransportationStatusOption[] {
    const normalizedSavedStatusId = this.normalizeTransportationStatusId(savedStatusId).toLowerCase();
    const currentIndex = TRANSPORTATION_STATUS_FLOW.findIndex((status) => status.value.toLowerCase() === normalizedSavedStatusId);

    if (currentIndex === -1) {
      return [TRANSPORTATION_STATUS_FLOW[0]];
    }

    if (currentIndex === TRANSPORTATION_STATUS_FLOW.length - 1) {
      return [TRANSPORTATION_STATUS_FLOW[currentIndex]];
    }

    return [TRANSPORTATION_STATUS_FLOW[currentIndex], TRANSPORTATION_STATUS_FLOW[currentIndex + 1]];
  }

  private parseDateOnly(value: string | null): Date | null {
    if (!value) {
      return null;
    }

    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  private getDriverWhatsappPhone(): string | null {
    return this.normalizeWhatsappPhone(this.driver()?.phoneNumber);
  }

  private normalizeWhatsappPhone(phoneNumber: string | null | undefined): string | null {
    const digitsOnly = (phoneNumber ?? '').replace(/\D/g, '');

    if (!digitsOnly) {
      return null;
    }

    const digitsWithoutInternationalPrefix = digitsOnly.replace(/^00/, '');
    const normalizedPhoneNumber = digitsWithoutInternationalPrefix.startsWith('591')
      ? digitsWithoutInternationalPrefix
      : `591${digitsWithoutInternationalPrefix.replace(/^0+/, '')}`;

    return normalizedPhoneNumber.length > 3 ? normalizedPhoneNumber : null;
  }

  private normalizeTransportationStatusId(statusId: string | null | undefined): string {
    const normalizedStatusId = statusId?.toLowerCase();

    return TRANSPORTATION_STATUS_FLOW.find((status) => status.value.toLowerCase() === normalizedStatusId)?.value
      ?? TRANSPORTATION_STATUS_IDS.enRutaAlDestino;
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}

function httpsUrlValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();

  if (!value) {
    return null;
  }

  return value.toLowerCase().startsWith('https') ? null : { httpsUrl: true };
}

const TRANSPORTATION_STATUS_IDS = {
  enRutaAlDestino: 'EA983AF9-C5E7-4510-827E-9D3B724D25F4',
  cargaRecogida: 'CA586A93-9031-4A44-8A13-CDA71BDA4E9A',
  enTransito: '38FB233B-C0DC-42A1-AAB0-41D5021BF874',
  finalizado: '72FDB57A-E489-4E8C-B9A6-C4A89AB6F7B6'
} as const;

const TRANSPORTATION_STATUS_FLOW: TransportationTimelineStep[] = [
  {
    label: 'En Ruta al Destino',
    value: TRANSPORTATION_STATUS_IDS.enRutaAlDestino,
    legend: 'El chofer se dirige al destino para recoger la carga.'
  },
  {
    label: 'Carga Recogida',
    value: TRANSPORTATION_STATUS_IDS.cargaRecogida,
    legend: 'La carga fue entregada al chofer y ya está en su posesión.'
  },
  {
    label: 'En Tránsito',
    value: TRANSPORTATION_STATUS_IDS.enTransito,
    legend: 'El chofer transporta la carga hacia la Aduana.'
  },
  {
    label: 'Finalizado',
    value: TRANSPORTATION_STATUS_IDS.finalizado,
    legend: 'La carga llegó a Aduana'
  }
];
