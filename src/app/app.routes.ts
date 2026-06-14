import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/auth.guard';
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
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('@pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'clients',
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
        path: 'imports',
        children: [
          {
            path: '',
            loadComponent: () => import('@pages/imports/list/imports-list.component').then((m) => m.ImportsListComponent)
          },
          {
            path: 'create',
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
        children: [
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
        loadComponent: () => import('@pages/settings/settings.component').then((m) => m.SettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
