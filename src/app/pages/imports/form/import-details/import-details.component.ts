import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { ImportDetailsFormModel } from '../../models/import-form.models';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { ClientsService } from '@services/clients/clients.service';
import { ClientOptionDto } from '@services/clients/clients.types';
import { AppToastService } from '@services/common/app-toast.service';
import { DriverService } from '@services/drivers/driver.service';
import { DriverOptionDto } from '@services/drivers/drivers.types';
import { UiBlockService } from '@services/common/ui-block.service';
import { isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import { ContainerTypeOption, CreateImportRequest, ImportDetailDto, UpdateImportRequest } from '@services/imports/imports.types';
import { ImportsService } from '@services/imports/imports.service';

@Component({
  selector: 'app-import-details',
  imports: [ReactiveFormsModule, AutoCompleteModule, ButtonModule, CardModule, InputTextModule, SelectModule],
  templateUrl: './import-details.component.html',
  styleUrl: './import-details.component.css'
})
export class ImportDetailsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly importsService = inject(ImportsService);
  private readonly clientsService = inject(ClientsService);
  private readonly driverService = inject(DriverService);
  private readonly router = inject(Router);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly importId = input<string | null>(null);
  readonly importItem = input<ImportDetailDto | null>(null);
  readonly containerTypeOptions = input.required<ContainerTypeOption[]>();
  readonly isLoadingImport = input(false);

  readonly importChanged = output<ImportDetailDto>();

  readonly isSaving = signal(false);
  readonly isLoadingClients = signal(false);
  readonly isLoadingDrivers = signal(false);
  readonly clientSuggestions = signal<ClientOptionDto[]>([]);
  readonly driverSuggestions = signal<DriverOptionDto[]>([]);
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importItem()?.statusId));

  readonly importForm: FormGroup<ImportDetailsFormModel> = this.formBuilder.group({
    client: this.formBuilder.control<ClientOptionDto | null>(null, [Validators.required]),
    driver: this.formBuilder.control<DriverOptionDto | null>(null),
    containerNumber: this.formBuilder.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    containerType: this.formBuilder.control<number | null>(null, [Validators.required])
  });

  constructor() {
    effect(() => {
      const importId = this.importId();
      const currentImport = this.importItem();

      if (!importId) {
        this.importForm.reset({
          client: null,
          driver: null,
          containerNumber: '',
          containerType: null
        });
        this.loadClientSuggestions();
        return;
      }

      if (!currentImport) {
        return;
      }

      const selectedClient = this.mapImportClient(currentImport);
      const selectedDriver = this.mapImportDriver(currentImport);
      const currentClientSuggestions = untracked(() => this.clientSuggestions());
      const currentDriverSuggestions = untracked(() => this.driverSuggestions());

      this.clientSuggestions.set(this.mergeClientOption(selectedClient, currentClientSuggestions));
      this.driverSuggestions.set(this.mergeDriverOption(selectedDriver, currentDriverSuggestions));

      this.importForm.reset({
        client: selectedClient,
        driver: selectedDriver,
        containerNumber: currentImport.containerNumber,
        containerType: currentImport.containerType
      });
    });

    effect(() => {
      if (this.isSaving() || this.isReadOnly()) {
        this.importForm.disable({ emitEvent: false });
        return;
      }

      this.importForm.enable({ emitEvent: false });
    });
  }

  onClientSearch(event: AutoCompleteCompleteEvent): void {
    if (this.isReadOnly()) {
      return;
    }

    const search = typeof event.query === 'string' ? event.query.trim() : '';

    if (search.length > 0 && search.length < 3) {
      return;
    }

    this.loadClientSuggestions(search || undefined);
  }

  onDriverSearch(event: AutoCompleteCompleteEvent): void {
    if (this.isReadOnly() || !this.importId()) {
      return;
    }

    const search = typeof event.query === 'string' ? event.query.trim() : '';

    if (search.length > 0 && search.length < 3) {
      return;
    }

    this.loadDriverSuggestions(search || undefined);
  }
 

  onCancel(): void {
    void this.router.navigate(['/imports']);
  }

  onSubmit(): void {
    if (this.importForm.invalid || this.isSaving() || this.isReadOnly()) {
      this.importForm.markAllAsTouched();
      return;
    }

    if (this.importId()) {
      this.updateImport();
      return;
    }

    this.createImport();
  }

  getFieldError(controlName: keyof ImportDetailsFormModel): string {
    const control = this.importForm.controls[controlName];

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

  private createImport(): void {
    const request = this.buildCreateRequest();

    if (!request) {
      return;
    }

    this.isSaving.set(true);
    this.uiBlockService.block();

    this.importsService
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

        void this.router.navigate(['/imports', response.data]);
      });
  }

  private updateImport(): void {
    const id = this.importId();
    const request = this.buildUpdateRequest();

    if (!id || !request) {
      return;
    }

    this.isSaving.set(true);
    this.uiBlockService.block();

    this.importsService
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

        this.refreshImport(id);
      });
  }

  private refreshImport(id: string): void {
    this.importsService.getById(id).subscribe((response) => {
      if (!response.data) {
        return;
      }

      this.importChanged.emit(response.data);
    });
  }

  private buildCreateRequest(): CreateImportRequest | null {
    const formValue = this.importForm.getRawValue();

    if (!formValue.client || formValue.containerType === null) {
      return null;
    }

    return {
      clientId: formValue.client.id,
      containerNumber: formValue.containerNumber.trim(),
      containerType: formValue.containerType
    };
  }

  private buildUpdateRequest(): UpdateImportRequest | null {
    const request = this.buildCreateRequest();

    if (!request) {
      return null;
    }

    return {
      ...request,
      driverId: this.importForm.controls.driver.value?.id ?? null
    };
  }

  private loadClientSuggestions(search?: string): void {
    this.isLoadingClients.set(true);

    this.clientsService
      .getOptions(search)
      .pipe(finalize(() => this.isLoadingClients.set(false)))
      .subscribe((response) => {
        const selectedClient = this.importForm.controls.client.value;
        this.clientSuggestions.set(this.mergeClientOption(selectedClient, response.data ?? []));
      });
  }

  private mapImportClient(importItem: ImportDetailDto): ClientOptionDto {
    return {
      id: importItem.clientId,
      name: importItem.clientFullName,
      taxId: importItem.clientTaxId
    };
  }

  private loadDriverSuggestions(search?: string): void {
    this.isLoadingDrivers.set(true);

    this.driverService
      .getOptions(search)
      .pipe(finalize(() => this.isLoadingDrivers.set(false)))
      .subscribe((response) => {
        const selectedDriver = this.importForm.controls.driver.value;
        this.driverSuggestions.set(this.mergeDriverOption(selectedDriver, response.data ?? []));
      });
  }

  private mapImportDriver(importItem: ImportDetailDto): DriverOptionDto | null {
    if (!importItem.driverId || !importItem.driver) {
      return null;
    }

    return {
      id: importItem.driverId,
      fullName: importItem.driver.fullName
    };
  }

  private mergeClientOption(selectedClient: ClientOptionDto | null, options: ClientOptionDto[]): ClientOptionDto[] {
    if (!selectedClient) {
      return options;
    }

    const hasSelectedClient = options.some((option) => option.id === selectedClient.id);

    if (hasSelectedClient) {
      return options;
    }

    return [selectedClient, ...options];
  }

  private mergeDriverOption(selectedDriver: DriverOptionDto | null, options: DriverOptionDto[]): DriverOptionDto[] {
    if (!selectedDriver) {
      return options;
    }

    const hasSelectedDriver = options.some((option) => option.id === selectedDriver.id);

    if (hasSelectedDriver) {
      return options;
    }

    return [selectedDriver, ...options];
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}
