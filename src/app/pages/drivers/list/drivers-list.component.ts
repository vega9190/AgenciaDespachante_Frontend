import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { DriverService } from '@services/drivers/driver.service';
import { DriverListItemDto, DriversListQuery } from '@services/drivers/drivers.types';
import { TooltipModule } from 'primeng/tooltip';

interface DriversFiltersForm {
  driverNumber: FormControl<number | null>;
  fullName: FormControl<string>;
  isActive: FormControl<boolean | null>;
  isExternal: FormControl<boolean | null>;
}

interface SelectOption {
  label: string;
  value: boolean | null;
}

@Component({
  selector: 'app-drivers-list',
  imports: [ReactiveFormsModule, DatePipe, ButtonModule, CardModule, InputNumberModule, InputTextModule, SelectModule, TableModule, TagModule, TooltipModule],
  templateUrl: './drivers-list.component.html',
  styleUrl: './drivers-list.component.css'
})
export class DriversListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly driverService = inject(DriverService);
  private readonly router = inject(Router);

  readonly pageSizeOptions = [10, 20, 50];
  readonly statusOptions: SelectOption[] = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];
  readonly driverTypeOptions: SelectOption[] = [
    { label: 'Todos', value: null },
    { label: 'Interno', value: false },
    { label: 'Externo', value: true }
  ];

  readonly isLoading = signal(false);
  readonly drivers = signal<DriverListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  readonly filtersForm: FormGroup<DriversFiltersForm> = this.formBuilder.group({
    driverNumber: this.formBuilder.control<number | null>(null),
    fullName: this.formBuilder.nonNullable.control(''),
    isActive: this.formBuilder.control<boolean | null>(null),
    isExternal: this.formBuilder.control<boolean | null>(null)
  });

  constructor() {    
  }

  onSearch(): void {
    this.page.set(1);
    this.loadDrivers();
  }

  onClear(): void {
    this.filtersForm.reset({
      driverNumber: null,
      fullName: '',
      isActive: null,
      isExternal: null
    });

    this.page.set(1);
    this.pageSize.set(10);
    this.loadDrivers();
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;

    this.pageSize.set(rows);
    this.page.set(Math.floor(first / rows) + 1);
    this.loadDrivers();
  }

  onEdit(driver: DriverListItemDto): void {
    void this.router.navigate(['/drivers', driver.id]);
  }

  onCreate(): void {
    void this.router.navigate(['/drivers/create']);
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getDriverTypeLabel(isExternal: boolean): string {
    return isExternal ? 'Externo' : 'Interno';
  }

  getDocumentLabel(itHasDocument: boolean): string {
    return itHasDocument ? 'Si' : 'No';
  }

  getDocumentSeverity(itHasDocument: boolean): 'success' | 'danger' {
    return itHasDocument ? 'success' : 'danger';
  }

  showExpirationAlert(driver: DriverListItemDto): boolean {
    return driver.isExpired || driver.itExpiresSoon;
  }

  getExpirationAlertTooltip(driver: DriverListItemDto): string {
    if (driver.isExpired) {
      return 'La tarjeta de Operación caducó';
    }

    return 'La tarjeta de Operación caducará pronto';
  }

  private loadDrivers(): void {
    this.isLoading.set(true);

    this.driverService
      .getList(this.buildQuery())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.drivers.set(response.data?.items ?? []);
        this.totalItems.set(response.data?.totalItems ?? 0);
      });
  }

  private buildQuery(): DriversListQuery {
    const formValue = this.filtersForm.getRawValue();

    return {
      page: this.page(),
      pageSize: this.pageSize(),
      driverNumber: formValue.driverNumber ?? undefined,
      fullName: formValue.fullName,
      isActive: formValue.isActive ?? undefined,
      isExternal: formValue.isExternal ?? undefined,
      sortBy: 'createdUtc',
      sortDirection: 'desc'
    };
  }
}
