import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { AppPhoneInputComponent } from '../../../common-components/phone-input/phone-input.component';
import { EmployeeFormModel } from '../models/employee-form.models';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { EmployeeService } from '@services/employees/employee.service';
import { EmployeeDetailDto, EmployeeRequest } from '@services/employees/employees.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, DatePipe, ButtonModule, CardModule, InputTextModule, ToggleSwitchModule, AppPhoneInputComponent],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly employee = signal<EmployeeDetailDto | null>(null);
  readonly employeeId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.employeeId() !== null);
  readonly pageTitle = computed(() => {
    if (!this.isEditMode()) {
      return 'Crear Trabajador';
    }

    const employeeNumber = this.employee()?.employeeNumber;
    return employeeNumber ? `Editar Trabajador - #${employeeNumber}` : 'Editar Trabajador';
  });

  readonly employeeForm: FormGroup<EmployeeFormModel> = this.formBuilder.group({
    firstName: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    lastName: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    address: this.formBuilder.nonNullable.control('', [Validators.maxLength(255)]),
    phone: this.formBuilder.nonNullable.control('', [Validators.maxLength(20)]),
    nationalId: this.formBuilder.nonNullable.control('', [Validators.maxLength(20)]),
    isActive: this.formBuilder.nonNullable.control(true)
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      this.employeeId.set(id);

      if (id) {
        this.loadEmployee(id);
        return;
      }

      this.employee.set(null);
      this.employeeForm.reset({
        firstName: '',
        lastName: '',
        address: '',
        phone: '',
        nationalId: '',
        isActive: true
      });
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid || this.isSaving()) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode()) {
      this.updateEmployee();
      return;
    }

    this.createEmployee();
  }

  onCancel(): void {
    void this.router.navigate(['/employees']);
  }

  getFieldError(controlName: keyof EmployeeFormModel): string {
    const control = this.employeeForm.controls[controlName];

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

  private loadEmployee(id: string): void {
    this.isLoading.set(true);

    this.employeeService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        const employee = response.data;
        this.employee.set(employee);

        if (!employee) {
          return;
        }

        this.employeeForm.reset({
          firstName: employee.firstName,
          lastName: employee.lastName,
          address: employee.address ?? '',
          phone: this.formatPhone(employee.phone ?? ''),
          nationalId: employee.nationalId ?? '',
          isActive: employee.isActive
        });
      });
  }

  private createEmployee(): void {
    const request = this.buildCreateRequest();
    this.isSaving.set(true);
    this.uiBlockService.block();

    this.employeeService
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

        const employeeId = response.data;

        void this.router.navigate(['/employees', employeeId]);
      });
  }

  private updateEmployee(): void {
    const id = this.employeeId();

    if (!id) {
      return;
    }

    const request = this.buildUpdateRequest();
    this.isSaving.set(true);
    this.uiBlockService.block();

    this.employeeService
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

        this.employee.update((current) =>
          current
            ? {
                ...current,
                ...request,
                address: request.address ?? null,
                phone: request.phone ?? null,
                nationalId: request.nationalId ?? null
              }
            : current
        );
      });
  }

  private buildCreateRequest(): EmployeeRequest {
    const formValue = this.employeeForm.getRawValue();

    return {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      address: this.normalizeOptionalText(formValue.address),
      phone: this.normalizePhoneDigits(formValue.phone),
      nationalId: this.normalizeOptionalText(formValue.nationalId),
      isActive: true
    };
  }

  private buildUpdateRequest(): EmployeeRequest {
    const formValue = this.employeeForm.getRawValue();

    return {
      ...this.buildCreateRequest(),
      isActive: formValue.isActive
    };
  }

  private normalizeOptionalText(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue === '' ? null : trimmedValue;
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }

  private normalizePhoneDigits(value: string): string | null {
    const digits = value.replace(/\D+/g, '').slice(0, 8);
    return digits === '' ? null : digits;
  }

  private formatPhone(value: string): string {
    const digits = value.replace(/\D+/g, '').slice(0, 8);

    if (digits.length <= 3) {
      return digits;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
}
