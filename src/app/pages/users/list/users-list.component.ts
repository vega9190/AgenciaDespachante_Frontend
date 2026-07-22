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

import { UserEditDialogComponent } from '../components/user-edit-dialog/user-edit-dialog.component';
import { RoleIds } from '@core/auth/role.constants';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { UserService } from '@services/users/user.service';
import { UserDetailDto, UserListItemDto, UsersListQuery, UserUpdateRequest } from '@services/users/users.types';
import { ResponsiveTableDirective } from '../../../common-components/responsive-table/responsive-table.directive';

interface UserFiltersForm {
  username: FormControl<string>;
  roleId: FormControl<string | null>;
  isActive: FormControl<boolean | null>;
}

interface UserStatusOption {
  label: string;
  value: boolean | null;
}

interface RoleFilterOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-users-list',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    UserEditDialogComponent,
    ResponsiveTableDirective
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly pageSizeOptions = [10, 20, 50];
  readonly statusOptions: UserStatusOption[] = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];
  readonly roleFilterOptions: RoleFilterOption[] = [
    { label: 'Todos', value: null },
    { label: 'Administrator', value: RoleIds.Administrator },
    { label: 'Manager', value: RoleIds.Manager },
    { label: 'Client', value: RoleIds.Client }
  ];

  readonly isLoading = signal(false);
  readonly users = signal<UserListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  readonly editDialogVisible = signal(false);
  readonly editingUser = signal<UserDetailDto | null>(null);
  readonly isSavingEdit = signal(false);

  readonly filtersForm: FormGroup<UserFiltersForm> = this.formBuilder.group({
    username: this.formBuilder.nonNullable.control(''),
    roleId: this.formBuilder.control<string | null>(null),
    isActive: this.formBuilder.control<boolean | null>(null)
  });

  onSearch(): void {
    this.page.set(1);
    this.loadUsers();
  }

  onClear(): void {
    this.filtersForm.reset({
      username: '',
      roleId: null,
      isActive: null
    });

    this.page.set(1);
    this.pageSize.set(10);
    this.loadUsers();
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;

    this.pageSize.set(rows);
    this.page.set(Math.floor(first / rows) + 1);
    this.loadUsers();
  }

  onCreate(): void {
    void this.router.navigate(['/users/create']);
  }

  onEdit(user: UserListItemDto): void {
    this.userService.getById(user.id).subscribe((response) => {
      if (!response.data) {
        return;
      }

      this.editingUser.set(response.data);
      this.editDialogVisible.set(true);
    });
  }

  onEditDialogCancelled(): void {
    this.editDialogVisible.set(false);
    this.editingUser.set(null);
  }

  onEditDialogSaved(request: UserUpdateRequest): void {
    const id = this.editingUser()?.id;

    if (!id) {
      return;
    }

    this.isSavingEdit.set(true);
    this.uiBlockService.block();

    this.userService
      .update(id, request)
      .pipe(
        finalize(() => {
          this.isSavingEdit.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!response.isValid) {
          return;
        }

        this.editDialogVisible.set(false);
        this.editingUser.set(null);
        this.loadUsers();
      });
  }

  getTypeLabel(user: UserListItemDto): string {
    return user.employeeId ? 'Trabajador' : 'Cliente';
  }

  getTypeSeverity(user: UserListItemDto): 'secondary' | 'info' {
    return user.employeeId ? 'secondary' : 'info';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  private loadUsers(): void {
    this.isLoading.set(true);

    this.userService
      .getList(this.buildQuery())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.users.set(response.data?.items ?? []);
        this.totalItems.set(response.data?.totalItems ?? 0);
      });
  }

  private buildQuery(): UsersListQuery {
    const formValue = this.filtersForm.getRawValue();

    return {
      page: this.page(),
      pageSize: this.pageSize(),
      username: formValue.username || undefined,
      roleId: formValue.roleId ?? undefined,
      isActive: formValue.isActive ?? undefined,
      sortBy: 'createdUtc',
      sortDirection: 'desc'
    };
  }
}
