import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '@core/auth/auth.service';
import { RoleIds } from '@core/auth/role.constants';
import { ClientsService } from '@services/clients/clients.service';
import { ClientOptionDto } from '@services/clients/clients.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { IMPORT_STATUS_IDS, isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import { ImportListItemDto, ImportsListQuery, ImportStatusOptionDto } from '@services/imports/imports.types';
import { ImportsService } from '@services/imports/imports.service';

interface ImportFiltersForm {
  importNumber: FormControl<string>;
  containerNumber: FormControl<string>;
  client: FormControl<ClientOptionDto | null>;
  statusId: FormControl<string | null>;
}

interface SelectOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-imports-list',
  imports: [ReactiveFormsModule, DatePipe, CurrencyPipe, AutoCompleteModule, ButtonModule, CardModule, ConfirmDialogModule, InputTextModule, SelectModule, TableModule, TagModule, TooltipModule],
  templateUrl: './imports-list.component.html',
  styleUrl: './imports-list.component.css'
})
export class ImportsListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly importsService = inject(ImportsService);
  private readonly clientsService = inject(ClientsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly pageSizeOptions = [10, 20, 50];
  readonly isLoading = signal(false);
  readonly isLoadingFilters = signal(false);
  readonly isLoadingClients = signal(false);
  readonly imports = signal<ImportListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());
  readonly clientSuggestions = signal<ClientOptionDto[]>([]);
  readonly statusOptions = signal<SelectOption[]>([{ label: 'Todos', value: null }]);
  readonly cancellingImportId = signal<string | null>(null);
  readonly canManageImports = computed(() => this.authService.hasRole(RoleIds.Administrator, RoleIds.Manager));

  readonly filtersForm: FormGroup<ImportFiltersForm> = this.formBuilder.group({
    importNumber: this.formBuilder.nonNullable.control(''),
    containerNumber: this.formBuilder.nonNullable.control(''),
    client: this.formBuilder.control<ClientOptionDto | null>(null),
    statusId: this.formBuilder.control<string | null>(null)
  });

  constructor() {
    this.loadFilterOptions();    
  }

  onSearch(): void {
    this.page.set(1);
    this.loadImports();
  }

  onClear(): void {
    this.filtersForm.reset({
      importNumber: '',
      containerNumber: '',
      client: null,
      statusId: null
    });

    this.page.set(1);
    this.pageSize.set(10);
    this.loadImports();
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;

    this.pageSize.set(rows);
    this.page.set(Math.floor(first / rows) + 1);
    this.loadImports();
  }

  onEdit(importItem: ImportListItemDto): void {
    void this.router.navigate(['/imports', importItem.id]);
  }

  onCreate(): void {
    void this.router.navigate(['/imports/create']);
  }

  onCancelImport(importItem: ImportListItemDto): void {
    if (!this.canCancelImport(importItem.statusId)) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Cancelar importación',
      message: '¿Está seguro de cancelar la importación?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancelImport(importItem.id)
    });
  }

  onClientSearch(event: AutoCompleteCompleteEvent): void {
    const search = typeof event.query === 'string' ? event.query.trim() : '';

    if (search.length > 0 && search.length < 3) {
      return;
    }

    this.loadClientSuggestions(search || undefined);
  }

  onClientDropdownClick(): void {
    this.loadClientSuggestions();
  }

  canCancelImport(statusId: string): boolean {
    return this.canManageImports() && !isReadOnlyImportStatus(statusId);
  }

  getStatusSeverity(statusId: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' {
    const normalizedStatusId = statusId.trim().toLowerCase();

    if (normalizedStatusId === IMPORT_STATUS_IDS.finalizado.toLowerCase()) {
      return 'success';
    }

    if (normalizedStatusId === IMPORT_STATUS_IDS.cancelado.toLowerCase()) {
      return 'danger';
    }

    if (normalizedStatusId === IMPORT_STATUS_IDS.nuevo.toLowerCase()) {
      return 'secondary';
    }

    return 'info';
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters.set(true);

    this.importsService
      .getStatusOptions()
      .pipe(finalize(() => this.isLoadingFilters.set(false)))
      .subscribe((response) => {
        this.statusOptions.set(this.mapStatusOptions(response.data ?? []));
      });
  }

  private loadImports(): void {
    this.isLoading.set(true);

    this.importsService
      .getList(this.buildQuery())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.imports.set(response.data?.items ?? []);
        this.totalItems.set(response.data?.totalItems ?? 0);
      });
  }

  private cancelImport(id: string): void {
    this.cancellingImportId.set(id);
    this.uiBlockService.block();

    this.importsService
      .updateStatus(id, { statusId: IMPORT_STATUS_IDS.cancelado })
      .pipe(
        finalize(() => {
          this.cancellingImportId.set(null);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!response?.isValid) {
          return;
        }

        this.loadImports();
      });
  }

  private buildQuery(): ImportsListQuery {
    const formValue = this.filtersForm.getRawValue();

    return {
      page: this.page(),
      pageSize: this.pageSize(),
      importNumber: formValue.importNumber,
      containerNumber: formValue.containerNumber,
      clientId: formValue.client?.id ?? undefined,
      statusId: formValue.statusId ?? undefined,
      sortBy: 'createdUtc',
      sortDirection: 'desc'
    };
  }

  private loadClientSuggestions(search?: string): void {
    this.isLoadingClients.set(true);

    this.clientsService
      .getOptions(search)
      .pipe(finalize(() => this.isLoadingClients.set(false)))
      .subscribe((response) => {
        const selectedClient = this.filtersForm.controls.client.value;
        this.clientSuggestions.set(this.mergeClientOption(selectedClient, response.data ?? []));
      });
  }

  private mapStatusOptions(options: ImportStatusOptionDto[]): SelectOption[] {
    return [{ label: 'Todos', value: null }, ...options.map((option) => ({ label: option.name, value: option.id }))];
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
}
