import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { AuthService } from '@core/auth/auth.service';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';
import { RoleIds } from '@core/auth/role.constants';
import { AppLayoutComponent } from '@layout/app.layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@pages/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: () => inject(AuthService).getHomeRoute()
      },
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: [RoleIds.Administrator] },
        loadComponent: () => import('@pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'clients',
        canActivate: [roleGuard],
        data: { roles: [RoleIds.Administrator, RoleIds.Manager] },
        children: [
          {
            path: '',
            loadComponent: () => import('@pages/clients/list/clients-list.component').then((m) => m.ClientsListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('@pages/clients/form/client-form.component').then((m) => m.ClientFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('@pages/clients/form/client-form.component').then((m) => m.ClientFormComponent)
          }
        ]
      },
      {
        path: 'employees',
        canActivate: [roleGuard],
        data: { roles: [RoleIds.Administrator, RoleIds.Manager] },
        children: [
          {
            path: '',
            loadComponent: () => import('@pages/employees/list/employees-list.component').then((m) => m.EmployeesListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('@pages/employees/form/employee-form.component').then((m) => m.EmployeeFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('@pages/employees/form/employee-form.component').then((m) => m.EmployeeFormComponent)
          }
        ]
      },
      {
        path: 'imports',
        children: [
          {
            path: '',
            loadComponent: () => import('@pages/imports/list/imports-list.component').then((m) => m.ImportsListComponent)
          },
          {
            path: 'create',
            canActivate: [roleGuard],
            data: { roles: [RoleIds.Administrator, RoleIds.Manager] },
            loadComponent: () => import('@pages/imports/form/import-form.component').then((m) => m.ImportFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('@pages/imports/form/import-form.component').then((m) => m.ImportFormComponent)
          }
        ]
      },
      {
        path: 'drivers',
        canActivate: [roleGuard],
        data: { roles: [RoleIds.Administrator, RoleIds.Manager] },
        children: [
          {
            path: '',
            loadComponent: () => import('@pages/drivers/list/drivers-list.component').then((m) => m.DriversListComponent)
          },
          {
            path: 'create',
            loadComponent: () => import('@pages/drivers/form/driver-form.component').then((m) => m.DriverFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('@pages/drivers/form/driver-form.component').then((m) => m.DriverFormComponent)
          }
        ]
      },      
      {
        path: 'tools',
        canActivate: [roleGuard],
        data: { roles: [RoleIds.Administrator, RoleIds.Manager] },
        children: [
          {
            path: 'quotation',
            loadComponent: () => import('@pages/tools/quotation/quotation.component').then((m) => m.QuotationComponent)
          },
          {
            path: 'generate-dam',
            loadComponent: () => import('@pages/tools/generate-dam/generate-dam.component').then((m) => m.GenerateDamComponent)
          },
          {
            path: 'tariff-item',
            loadComponent: () => import('@pages/tools/tariff-item/tariff-item.component').then((m) => m.TariffItemComponent)
          }
        ]
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: [RoleIds.Administrator, RoleIds.Manager] },
        loadComponent: () => import('@pages/settings/settings.component').then((m) => m.SettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
