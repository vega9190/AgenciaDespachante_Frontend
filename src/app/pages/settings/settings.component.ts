import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';

import { BorrowedNitsService } from '@services/borrowed-nits/borrowed-nits.service';
import { BorrowedNitListItemDto, BorrowedNitRequest } from '@services/borrowed-nits/borrowed-nits.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { TenantSettingsService } from '@services/tenant/tenant-settings.service';
import { UpdateTenantSettingsRequest } from '@services/tenant/tenant-settings.types';

interface SettingsForm {
  officialExchangeRate: FormControl<number | null>;
  parallelExchangeRate: FormControl<number | null>;
  defaultImportCharge: FormControl<number | null>;
  insuranceRate: FormControl<number | null>;
  iva: FormControl<number | null>;
  ice: FormControl<number | null>;
}

interface BorrowedNitDialogForm {
  name: FormControl<string>;
  nit: FormControl<string>;
  isActive: FormControl<boolean>;
}

const MAX_EXCHANGE_VALUE = 99;
const DECIMAL_INPUT_STEP = 0;
const MAX_CURRENCY_VALUE = 9999;
const MAX_PERCENTAGE_VALUE = 100;
const MIN_POSITIVE_VALUE = 0;

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputGroup,
    InputGroupAddonModule,
    InputNumberModule,
    InputTextModule,
    TableModule,
    TagModule,
    ToggleSwitchModule,
    TooltipModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly tenantSettingsService = inject(TenantSettingsService);
  private readonly borrowedNitsService = inject(BorrowedNitsService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly decimalStep = DECIMAL_INPUT_STEP;
  readonly maxExchangeValue = MAX_EXCHANGE_VALUE;
  readonly maxCurrencyValue = MAX_CURRENCY_VALUE;
  readonly maxPercentageValue = MAX_PERCENTAGE_VALUE;
  readonly minPositiveValue = MIN_POSITIVE_VALUE;

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isBorrowedNitsLoading = signal(false);
  readonly isBorrowedNitSaving = signal(false);
  readonly borrowedNits = signal<BorrowedNitListItemDto[]>([]);
  readonly borrowedNitDialogVisible = signal(false);
  readonly editingBorrowedNit = signal<BorrowedNitListItemDto | null>(null);
  readonly isEditBorrowedNitMode = computed(() => this.editingBorrowedNit() !== null);
  readonly borrowedNitDialogTitle = computed(() => (this.isEditBorrowedNitMode() ? 'Editar NIT Prestado' : 'Agregar NIT Prestado'));

  readonly settingsForm: FormGroup<SettingsForm> = this.formBuilder.group({
    officialExchangeRate: this.formBuilder.control<number | null>(null, this.requiredPositiveDecimalValidators(MAX_CURRENCY_VALUE)),
    parallelExchangeRate: this.formBuilder.control<number | null>(null, this.requiredPositiveDecimalValidators(MAX_CURRENCY_VALUE)),
    defaultImportCharge: this.formBuilder.control<number | null>(null, this.requiredPositiveDecimalValidators(MAX_CURRENCY_VALUE)),
    insuranceRate: this.formBuilder.control<number | null>(null, this.requiredPositiveDecimalValidators(MAX_PERCENTAGE_VALUE)),
    iva: this.formBuilder.control<number | null>(null, this.requiredPositiveDecimalValidators(MAX_PERCENTAGE_VALUE)),
    ice: this.formBuilder.control<number | null>(null, this.requiredPositiveDecimalValidators(MAX_PERCENTAGE_VALUE))
  });

  readonly borrowedNitForm: FormGroup<BorrowedNitDialogForm> = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    nit: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(20)]),
    isActive: this.formBuilder.nonNullable.control(true)
  });

  constructor() {
    this.loadInitialData();
  }

  onSaveSettings(): void {
    if (this.settingsForm.invalid || this.isSaving()) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.uiBlockService.block();

    this.tenantSettingsService
      .updateSettings(this.buildSettingsRequest())
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);
      });
  }

  onCreateBorrowedNit(): void {
    this.editingBorrowedNit.set(null);
    this.borrowedNitForm.reset({
      name: '',
      nit: '',
      isActive: true
    });
    this.borrowedNitDialogVisible.set(true);
  }

  onEditBorrowedNit(item: BorrowedNitListItemDto): void {
    this.editingBorrowedNit.set(item);
    this.borrowedNitForm.reset({
      name: item.name,
      nit: item.nit,
      isActive: item.isActive
    });
    this.borrowedNitDialogVisible.set(true);
  }

  onCancelBorrowedNitDialog(): void {
    if (this.isBorrowedNitSaving()) {
      return;
    }

    this.borrowedNitDialogVisible.set(false);
    this.editingBorrowedNit.set(null);
  }

  onBorrowedNitDialogHide(): void {
    this.borrowedNitDialogVisible.set(false);
    this.editingBorrowedNit.set(null);
  }

  onSaveBorrowedNit(): void {
    if (this.borrowedNitForm.invalid || this.isBorrowedNitSaving()) {
      this.borrowedNitForm.markAllAsTouched();
      return;
    }

    const request = this.buildBorrowedNitRequest();
    this.isBorrowedNitSaving.set(true);
    this.uiBlockService.block();

    this.borrowedNitsService
      .save(request)
      .pipe(
        finalize(() => {
          this.isBorrowedNitSaving.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!response.isValid) {
          return;
        }

        this.borrowedNitDialogVisible.set(false);
        this.editingBorrowedNit.set(null);
        this.loadBorrowedNits();
      });
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getSettingsFieldError(controlName: keyof SettingsForm, maxValue: number, unitLabel: string): string {
    const control = this.settingsForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('min')) {
      return 'El valor debe ser mayor a 0.';
    }

    if (control.hasError('max')) {
      return `El valor no puede ser mayor a ${maxValue} ${unitLabel}.`;
    }

    return '';
  }

  getBorrowedNitFieldError(controlName: keyof BorrowedNitDialogForm): string {
    const control = this.borrowedNitForm.controls[controlName];

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

  private loadInitialData(): void {
    this.isLoading.set(true);

    this.tenantSettingsService
      .getSettings()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        const settings = response.data;

        if (settings) {
          this.settingsForm.reset({
            officialExchangeRate: settings.officialExchangeRate,
            parallelExchangeRate: settings.parallelExchangeRate,
            defaultImportCharge: settings.defaultImportCharge,
            insuranceRate: settings.insuranceRate,
            iva: settings.iva,
            ice: settings.ice
          });
        }
      });

    this.loadBorrowedNits();
  }

  private loadBorrowedNits(): void {
    this.isBorrowedNitsLoading.set(true);

    this.borrowedNitsService
      .getList({
        page: 1,
        pageSize: 100,
        sortBy: 'createdUtc',
        sortDirection: 'desc'
      })
      .pipe(finalize(() => this.isBorrowedNitsLoading.set(false)))
      .subscribe((response) => {
        this.borrowedNits.set(response.data?.items ?? []);
      });
  }

  private buildSettingsRequest(): UpdateTenantSettingsRequest {
    const formValue = this.settingsForm.getRawValue();

    return {
      officialExchangeRate: formValue.officialExchangeRate ?? 0,
      parallelExchangeRate: formValue.parallelExchangeRate ?? 0,
      defaultImportCharge: formValue.defaultImportCharge ?? 0,
      insuranceRate: formValue.insuranceRate ?? 0,
      iva: formValue.iva ?? 0,
      ice: formValue.ice ?? 0
    };
  }

  private buildBorrowedNitRequest(): BorrowedNitRequest {
    const formValue = this.borrowedNitForm.getRawValue();

    return {
      id: this.editingBorrowedNit()?.id ?? null,
      name: formValue.name.trim(),
      nit: formValue.nit.trim(),
      isActive: formValue.isActive
    };
  }

  private requiredPositiveDecimalValidators(maxValue: number): ValidatorFn[] {
    return [Validators.required, Validators.min(MIN_POSITIVE_VALUE), Validators.max(maxValue)];
  }
}
