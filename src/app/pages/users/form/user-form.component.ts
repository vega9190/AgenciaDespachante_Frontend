import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { UserFormModel, UserPersonType } from '../models/user-form.models';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { RoleIds } from '@core/auth/role.constants';
import { ClientsService } from '@services/clients/clients.service';
import { ClientOptionDto } from '@services/clients/clients.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { EmployeeService } from '@services/employees/employee.service';
import { EmployeeOptionDto } from '@services/employees/employees.types';
import { UserService } from '@services/users/user.service';
import { UserCreateRequest } from '@services/users/users.types';

interface RoleOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, AutoCompleteModule, ButtonModule, CardModule, InputTextModule, SelectModule, ToggleSwitchModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly employeeService = inject(EmployeeService);
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly roleOptions: RoleOption[] = [
    { label: 'Administrator', value: RoleIds.Administrator },
    { label: 'Manager', value: RoleIds.Manager },
    { label: 'Client', value: RoleIds.Client }
  ];

  readonly personType = signal<UserPersonType>('employee');
  readonly availableRoleOptions = computed(() =>
    this.personType() === 'client'
      ? this.roleOptions.filter((option) => option.value === RoleIds.Client)
      : this.roleOptions.filter((option) => option.value !== RoleIds.Client)
  );
  readonly isSaving = signal(false);
  readonly isLoadingEmployees = signal(false);
  readonly isLoadingClients = signal(false);
  readonly employeeSuggestions = signal<EmployeeOptionDto[]>([]);
  readonly clientSuggestions = signal<ClientOptionDto[]>([]);

  readonly userForm: FormGroup<UserFormModel> = this.formBuilder.group({
    employee: this.formBuilder.control<EmployeeOptionDto | null>(null),
    client: this.formBuilder.control<ClientOptionDto | null>(null),
    username: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    password: this.formBuilder.nonNullable.control('', [Validators.required, Validators.minLength(6)]),
    roleId: this.formBuilder.control<string | null>(null, [Validators.required]),
    isActive: this.formBuilder.nonNullable.control(true)
  });

  constructor() {
    this.loadEmployeeSuggestions();
  }

  onPersonTypeChange(type: UserPersonType): void {
    if (this.personType() === type) {
      return;
    }

    this.personType.set(type);
    this.userForm.patchValue({ employee: null, client: null });

    if (type === 'client') {
      this.userForm.controls.roleId.setValue(RoleIds.Client);
      this.userForm.controls.roleId.disable();
    } else {
      this.userForm.controls.roleId.enable();

      if (this.userForm.controls.roleId.value === RoleIds.Client) {
        this.userForm.controls.roleId.setValue(null);
      }
    }

    if (type === 'employee' && this.employeeSuggestions().length === 0) {
      this.loadEmployeeSuggestions();
    }

    if (type === 'client' && this.clientSuggestions().length === 0) {
      this.loadClientSuggestions();
    }
  }

  onEmployeeSearch(event: AutoCompleteCompleteEvent): void {
    const search = typeof event.query === 'string' ? event.query.trim() : '';

    if (search.length > 0 && search.length < 3) {
      return;
    }

    this.loadEmployeeSuggestions(search || undefined);
  }

  onClientSearch(event: AutoCompleteCompleteEvent): void {
    const search = typeof event.query === 'string' ? event.query.trim() : '';

    if (search.length > 0 && search.length < 3) {
      return;
    }

    this.loadClientSuggestions(search || undefined);
  }

  onCancel(): void {
    void this.router.navigate(['/users']);
  }

  onSubmit(): void {
    if (this.userForm.invalid || this.isSaving()) {
      this.userForm.markAllAsTouched();
      return;
    }

    const request = this.buildCreateRequest();

    if (!request) {
      this.appToastService.showServerError('Debes vincular un trabajador o un cliente, y seleccionar un rol.');
      return;
    }

    this.isSaving.set(true);
    this.uiBlockService.block();

    this.userService
      .create(request)
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

        void this.router.navigate(['/users']);
      });
  }

  getFieldError(controlName: keyof UserFormModel): string {
    const control = this.userForm.controls[controlName];

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
      return 'La contraseña debe tener al menos 6 caracteres.';
    }

    return '';
  }

  private buildCreateRequest(): UserCreateRequest | null {
    const formValue = this.userForm.getRawValue();
    const employeeId = this.personType() === 'employee' ? (formValue.employee?.id ?? null) : null;
    const clientId = this.personType() === 'client' ? (formValue.client?.id ?? null) : null;
    const roleId = formValue.roleId;

    if ((!employeeId && !clientId) || !roleId) {
      return null;
    }

    return {
      employeeId,
      clientId,
      username: formValue.username.trim(),
      password: formValue.password,
      roleId,
      isActive: formValue.isActive
    };
  }

  private loadEmployeeSuggestions(search?: string): void {
    this.isLoadingEmployees.set(true);

    this.employeeService
      .getOptions(search, true)
      .pipe(finalize(() => this.isLoadingEmployees.set(false)))
      .subscribe((response) => {
        this.employeeSuggestions.set(response.data ?? []);
      });
  }

  private loadClientSuggestions(search?: string): void {
    this.isLoadingClients.set(true);

    this.clientsService
      .getOptions(search, true)
      .pipe(finalize(() => this.isLoadingClients.set(false)))
      .subscribe((response) => {
        this.clientSuggestions.set(response.data ?? []);
      });
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}
