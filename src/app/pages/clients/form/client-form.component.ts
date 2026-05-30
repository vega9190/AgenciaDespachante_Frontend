import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import { ApiResult, ApiResultOf } from '@models/api.types';
import { ClientsService } from '@services/clients/clients.service';
import { ClientCreateRequest, ClientDetailDto, ClientUpdateRequest } from '@services/clients/clients.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';

interface ClientFormModel {
  companyName: FormControl<string>;
  contactName: FormControl<string>;
  address: FormControl<string>;
  contactPhone: FormControl<string>;
  taxId: FormControl<string>;
  isActive: FormControl<boolean>;
}

@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule, DatePipe, ButtonModule, CardModule, InputTextModule, ToggleSwitchModule],
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.css'
})
export class ClientFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly client = signal<ClientDetailDto | null>(null);
  readonly clientId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.clientId() !== null);
  readonly pageTitle = computed(() => {
    if (!this.isEditMode()) {
      return 'Crear Cliente';
    }

    const clientNumber = this.client()?.clientNumber;
    return clientNumber ? `Editar Cliente - #${clientNumber}` : 'Editar Cliente';
  });

  readonly clientForm: FormGroup<ClientFormModel> = this.formBuilder.group({
    companyName: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(150)]),
    contactName: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    address: this.formBuilder.nonNullable.control('', [Validators.maxLength(255)]),
    contactPhone: this.formBuilder.nonNullable.control('', [Validators.maxLength(20)]),
    taxId: this.formBuilder.nonNullable.control('', [Validators.maxLength(20)]),
    isActive: this.formBuilder.nonNullable.control(true)
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      this.clientId.set(id);

      if (id) {
        this.loadClient(id);
        return;
      }

      this.client.set(null);
      this.clientForm.reset({
        companyName: '',
        contactName: '',
        address: '',
        contactPhone: '',
        taxId: '',
        isActive: true
      });
    });
  }

  onSubmit(): void {
    if (this.clientForm.invalid || this.isSaving()) {
      this.clientForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode()) {
      this.updateClient();
      return;
    }

    this.createClient();
  }

  onCancel(): void {
    void this.router.navigate(['/clients']);
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const maskedValue = this.formatPhone(input.value);

    if (input.value !== maskedValue) {
      input.value = maskedValue;
    }

    this.clientForm.controls.contactPhone.setValue(maskedValue);
  }

  getFieldError(controlName: keyof ClientFormModel): string {
    const control = this.clientForm.controls[controlName];

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

  private loadClient(id: string): void {
    this.isLoading.set(true);

    this.clientsService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        const client = response.data;
        this.client.set(client);

        if (!client) {
          return;
        }

        this.clientForm.reset({
          companyName: client.companyName,
          contactName: client.contactName,
          address: client.address ?? '',
          contactPhone: this.formatPhone(client.contactPhone ?? ''),
          taxId: client.taxId ?? '',
          isActive: client.isActive
        });
      });
  }

  private createClient(): void {
    const request = this.buildCreateRequest();
    this.isSaving.set(true);
    this.uiBlockService.block();

    this.clientsService
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

        const clientId = response.data;

        void this.router.navigate(['/clients', clientId]);
      });
  }

  private updateClient(): void {
    const id = this.clientId();

    if (!id) {
      return;
    }

    const request = this.buildUpdateRequest();
    this.isSaving.set(true);
    this.uiBlockService.block();

    this.clientsService
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

        this.client.update((current) =>
          current
            ? {
                ...current,
                ...request,
                address: request.address ?? null,
                contactPhone: request.contactPhone ?? null,
                taxId: request.taxId ?? null
              }
            : current
        );
      });
  }

  private buildCreateRequest(): ClientCreateRequest {
    const formValue = this.clientForm.getRawValue();

    return {
      companyName: formValue.companyName.trim(),
      contactName: formValue.contactName.trim(),
      address: this.normalizeOptionalText(formValue.address),
      contactPhone: this.normalizePhoneDigits(formValue.contactPhone),
      taxId: this.normalizeOptionalText(formValue.taxId),
      isActive: true
    };
  }

  private buildUpdateRequest(): ClientUpdateRequest {
    const formValue = this.clientForm.getRawValue();

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
