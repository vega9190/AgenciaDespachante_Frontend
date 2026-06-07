import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { AppPhoneInputComponent } from '../../../common-components/app-phone-input/app-phone-input.component';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { DriverService } from '@services/drivers/driver.service';
import { DriverCreateRequest, DriverDetailDto, DriverUpdateRequest } from '@services/drivers/drivers.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';

interface DriverFormModel {
  name: FormControl<string>;
  lastName: FormControl<string>;
  phoneNumber: FormControl<string>;
  isExternal: FormControl<boolean | null>;
  isActive: FormControl<boolean>;
}

interface DriverTypeOption {
  label: string;
  value: boolean;
}

@Component({
  selector: 'app-driver-form',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    AppPhoneInputComponent
  ],
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.css'
})
export class DriverFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly driverService = inject(DriverService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly driverTypeOptions: DriverTypeOption[] = [
    { label: 'Interno', value: false },
    { label: 'Externo', value: true }
  ];

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly driver = signal<DriverDetailDto | null>(null);
  readonly driverId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.driverId() !== null);
  readonly pageTitle = computed(() => {
    if (!this.isEditMode()) {
      return 'Crear Chofer';
    }

    const driverNumber = this.driver()?.driverNumber;
    return driverNumber ? `Editar Chofer - #${driverNumber}` : 'Editar Chofer';
  });

  readonly driverForm: FormGroup<DriverFormModel> = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    lastName: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    phoneNumber: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(9)]),
    isExternal: this.formBuilder.control<boolean | null>(null, [Validators.required]),
    isActive: this.formBuilder.nonNullable.control(true)
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
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
        isActive: true
      });
    });
  }

  onSubmit(): void {
    if (this.driverForm.invalid || this.isSaving()) {
      this.driverForm.markAllAsTouched();
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

  getFieldError(controlName: keyof DriverFormModel): string {
    const control = this.driverForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
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

        this.driverForm.reset({
          name: driver.name,
          lastName: driver.lastName,
          phoneNumber: this.formatPhone(driver.phoneNumber),
          isExternal: driver.isExternal,
          isActive: driver.isActive
        });
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
      isActive: formValue.isActive
    };
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
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
}
