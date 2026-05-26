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
        path: 'orders',
        children: [
          {
            path: '',
            loadComponent: () => import('@pages/orders/list/orders-list.component').then((m) => m.OrdersListComponent)
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
