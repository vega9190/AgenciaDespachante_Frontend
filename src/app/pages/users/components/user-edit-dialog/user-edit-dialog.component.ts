import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { UserEditFormModel } from '../../models/user-form.models';
import { RoleIds } from '@core/auth/role.constants';
import { UserDetailDto, UserUpdateRequest } from '@services/users/users.types';

interface RoleOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-user-edit-dialog',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TagModule, ToggleSwitchModule],
  templateUrl: './user-edit-dialog.component.html',
  styleUrl: './user-edit-dialog.component.css'
})
export class UserEditDialogComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly visible = input(false);
  readonly user = input<UserDetailDto | null>(null);
  readonly isSaving = input(false);

  readonly cancelled = output<void>();
  readonly saved = output<UserUpdateRequest>();

  readonly roleOptions: RoleOption[] = [
    { label: 'Administrator', value: RoleIds.Administrator },
    { label: 'Manager', value: RoleIds.Manager },
    { label: 'Client', value: RoleIds.Client }
  ];

  readonly isClientUser = computed(() => !!this.user()?.clientId);
  readonly personTypeLabel = computed(() => (this.isClientUser() ? 'Cliente' : 'Trabajador'));
  readonly initials = computed(() => {
    const parts = (this.user()?.displayName ?? '').trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return '';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  });
  readonly availableRoleOptions = computed(() =>
    this.isClientUser()
      ? this.roleOptions.filter((option) => option.value === RoleIds.Client)
      : this.roleOptions.filter((option) => option.value !== RoleIds.Client)
  );

  readonly userEditForm: FormGroup<UserEditFormModel> = this.formBuilder.group({
    username: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    password: this.formBuilder.nonNullable.control('', [Validators.minLength(6)]),
    roleId: this.formBuilder.control<string | null>(null, [Validators.required]),
    isActive: this.formBuilder.nonNullable.control(true)
  });

  constructor() {
    effect(() => {
      const currentUser = this.user();

      if (!currentUser) {
        return;
      }

      const isClientUser = !!currentUser.clientId;
      const matchedRole = this.roleOptions.find((option) => option.value.toUpperCase() === currentUser.roleId.toUpperCase());
      const roleId = isClientUser ? RoleIds.Client : (matchedRole?.value ?? null);

      this.userEditForm.reset({
        username: currentUser.username,
        password: '',
        roleId,
        isActive: currentUser.isActive
      });

      if (isClientUser) {
        this.userEditForm.controls.roleId.disable();
      } else {
        this.userEditForm.controls.roleId.enable();
      }
    });
  }

  onHide(): void {
    this.cancelled.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSave(): void {
    if (this.userEditForm.invalid || this.isSaving()) {
      this.userEditForm.markAllAsTouched();
      return;
    }

    const formValue = this.userEditForm.getRawValue();

    if (!formValue.roleId) {
      return;
    }

    const request: UserUpdateRequest = {
      username: formValue.username.trim(),
      roleId: formValue.roleId,
      isActive: formValue.isActive,
      password: formValue.password.trim() ? formValue.password : null
    };

    this.saved.emit(request);
  }

  getFieldError(controlName: keyof UserEditFormModel): string {
    const control = this.userEditForm.controls[controlName];

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
}
