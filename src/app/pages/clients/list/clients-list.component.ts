import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { ClientsService } from '@services/clients/clients.service';
import { ClientListItemDto, ClientsListQuery } from '@services/clients/clients.types';

interface ClientFiltersForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  taxId: FormControl<string>;
  phone: FormControl<string>;
  isActive: FormControl<boolean | null>;
}

interface ClientStatusOption {
  label: string;
  value: boolean | null;
}

@Component({
  selector: 'app-clients-list',
  imports: [ReactiveFormsModule, DatePipe, ButtonModule, CardModule, InputTextModule, SelectModule, TableModule, TagModule],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.css'
})
export class ClientsListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly clientsService = inject(ClientsService);

  readonly pageSizeOptions = [10, 20, 50];
  readonly statusOptions: ClientStatusOption[] = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  readonly isLoading = signal(false);
  readonly clients = signal<ClientListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  readonly filtersForm: FormGroup<ClientFiltersForm> = this.formBuilder.group({
    firstName: this.formBuilder.nonNullable.control(''),
    lastName: this.formBuilder.nonNullable.control(''),
    taxId: this.formBuilder.nonNullable.control(''),
    phone: this.formBuilder.nonNullable.control(''),
    isActive: this.formBuilder.control<boolean | null>(null)
  });

  constructor() {
    this.loadClients();
  }

  onSearch(): void {
    this.page.set(1);
    this.loadClients();
  }

  onClear(): void {
    this.filtersForm.reset({
      firstName: '',
      lastName: '',
      taxId: '',
      phone: '',
      isActive: null
    });

    this.page.set(1);
    this.pageSize.set(10);
    this.loadClients();
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitizedValue = input.value.replace(/\D+/g, '');

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
    }

    this.filtersForm.controls.phone.setValue(sanitizedValue);
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;

    this.pageSize.set(rows);
    this.page.set(Math.floor(first / rows) + 1);
    this.loadClients();
  }

  onEdit(client: ClientListItemDto): void {
    console.log('Editar cliente', client);
  }

  onCreate(): void {
    console.log('Nuevo cliente');
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  private loadClients(): void {
    this.isLoading.set(true);

    this.clientsService
      .getList(this.buildQuery())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.clients.set(response.data?.items ?? []);
        this.totalItems.set(response.data?.totalItems ?? 0);
      });
  }

  private buildQuery(): ClientsListQuery {
    const formValue = this.filtersForm.getRawValue();

    return {
      page: this.page(),
      pageSize: this.pageSize(),
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      taxId: formValue.taxId,
      phone: formValue.phone,
      isActive: formValue.isActive ?? undefined,
      sortBy: 'createdUtc',
      sortDirection: 'desc'
    };
  }
}
