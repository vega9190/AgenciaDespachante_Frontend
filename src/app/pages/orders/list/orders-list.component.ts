import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { ClientsService } from '@services/clients/clients.service';
import { ClientOptionDto } from '@services/clients/clients.types';
import { OrderListItemDto, OrdersListQuery, OrderStatusOptionDto } from '@services/orders/orders.types';
import { OrdersService } from '@services/orders/orders.service';

interface OrderFiltersForm {
  orderNumber: FormControl<string>;
  containerNumber: FormControl<string>;
  client: FormControl<ClientOptionDto | null>;
  statusId: FormControl<string | null>;
}

interface SelectOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-orders-list',
  imports: [ReactiveFormsModule, DatePipe, CurrencyPipe, AutoCompleteModule, ButtonModule, CardModule, InputTextModule, SelectModule, TableModule, TagModule],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.css'
})
export class OrdersListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly clientsService = inject(ClientsService);
  private readonly router = inject(Router);

  readonly pageSizeOptions = [10, 20, 50];
  readonly isLoading = signal(false);
  readonly isLoadingFilters = signal(false);
  readonly isLoadingClients = signal(false);
  readonly orders = signal<OrderListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());
  readonly clientSuggestions = signal<ClientOptionDto[]>([]);
  readonly statusOptions = signal<SelectOption[]>([{ label: 'Todos', value: null }]);

  readonly filtersForm: FormGroup<OrderFiltersForm> = this.formBuilder.group({
    orderNumber: this.formBuilder.nonNullable.control(''),
    containerNumber: this.formBuilder.nonNullable.control(''),
    client: this.formBuilder.control<ClientOptionDto | null>(null),
    statusId: this.formBuilder.control<string | null>(null)
  });

  constructor() {
    this.loadFilterOptions();
    this.loadOrders();
  }

  onSearch(): void {
    this.page.set(1);
    this.loadOrders();
  }

  onClear(): void {
    this.filtersForm.reset({
      orderNumber: '',
      containerNumber: '',
      client: null,
      statusId: null
    });

    this.page.set(1);
    this.pageSize.set(10);
    this.loadOrders();
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;

    this.pageSize.set(rows);
    this.page.set(Math.floor(first / rows) + 1);
    this.loadOrders();
  }

  onEdit(order: OrderListItemDto): void {
    void this.router.navigate(['/orders', order.id]);
  }

  onCreate(): void {
    void this.router.navigate(['/orders/create']);
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

  getStatusSeverity(statusName: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' {
    const normalizedStatus = statusName.trim().toLowerCase();

    if (normalizedStatus.includes('entregado') || normalizedStatus.includes('completado') || normalizedStatus.includes('finalizado')) {
      return 'success';
    }

    if (normalizedStatus.includes('proceso') || normalizedStatus.includes('curso') || normalizedStatus.includes('gestion')) {
      return 'info';
    }

    if (normalizedStatus.includes('pendiente')) {
      return 'warn';
    }

    if (normalizedStatus.includes('cancelado') || normalizedStatus.includes('rechazado')) {
      return 'danger';
    }

    return 'secondary';
  }

  private loadFilterOptions(): void {
    this.isLoadingFilters.set(true);

    this.ordersService
      .getStatusOptions()
      .pipe(finalize(() => this.isLoadingFilters.set(false)))
      .subscribe((response) => {
        this.statusOptions.set(this.mapStatusOptions(response.data ?? []));
      });
  }

  private loadOrders(): void {
    this.isLoading.set(true);

    this.ordersService
      .getList(this.buildQuery())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.orders.set(response.data?.items ?? []);
        this.totalItems.set(response.data?.totalItems ?? 0);
      });
  }

  private buildQuery(): OrdersListQuery {
    const formValue = this.filtersForm.getRawValue();

    return {
      page: this.page(),
      pageSize: this.pageSize(),
      orderNumber: formValue.orderNumber,
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

  private mapStatusOptions(options: OrderStatusOptionDto[]): SelectOption[] {
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
