import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { EmployeeService } from '@services/employees/employee.service';
import { EmployeeListItemDto, EmployeesListQuery } from '@services/employees/employees.types';
import { ResponsiveTableDirective } from '../../../common-components/responsive-table/responsive-table.directive';

interface EmployeeFiltersForm {
  name: FormControl<string>;
  nationalId: FormControl<string>;
  isActive: FormControl<boolean | null>;
}

interface EmployeeStatusOption {
  label: string;
  value: boolean | null;
}

@Component({
  selector: 'app-employees-list',
  imports: [ReactiveFormsModule, DatePipe, ButtonModule, CardModule, InputTextModule, SelectModule, TableModule, TagModule, TooltipModule, ResponsiveTableDirective],
  templateUrl: './employees-list.component.html',
  styleUrl: './employees-list.component.css'
})
export class EmployeesListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);

  readonly pageSizeOptions = [10, 20, 50];
  readonly statusOptions: EmployeeStatusOption[] = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  readonly isLoading = signal(false);
  readonly employees = signal<EmployeeListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  readonly filtersForm: FormGroup<EmployeeFiltersForm> = this.formBuilder.group({
    name: this.formBuilder.nonNullable.control(''),
    nationalId: this.formBuilder.nonNullable.control(''),
    isActive: this.formBuilder.control<boolean | null>(null)
  });

  onSearch(): void {
    this.page.set(1);
    this.loadEmployees();
  }

  onClear(): void {
    this.filtersForm.reset({
      name: '',
      nationalId: '',
      isActive: null
    });

    this.page.set(1);
    this.pageSize.set(10);
    this.loadEmployees();
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;

    this.pageSize.set(rows);
    this.page.set(Math.floor(first / rows) + 1);
    this.loadEmployees();
  }

  onEdit(employee: EmployeeListItemDto): void {
    void this.router.navigate(['/employees', employee.id]);
  }

  onCreate(): void {
    void this.router.navigate(['/employees/create']);
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  private loadEmployees(): void {
    this.isLoading.set(true);

    this.employeeService
      .getList(this.buildQuery())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.employees.set(response.data?.items ?? []);
        this.totalItems.set(response.data?.totalItems ?? 0);
      });
  }

  private buildQuery(): EmployeesListQuery {
    const formValue = this.filtersForm.getRawValue();

    return {
      page: this.page(),
      pageSize: this.pageSize(),
      name: formValue.name,
      nationalId: formValue.nationalId,
      isActive: formValue.isActive ?? undefined,
      sortBy: 'createdUtc',
      sortDirection: 'desc'
    };
  }
}
