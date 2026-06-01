import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

import { AuthService } from '@core/auth/auth.service';
import { TenantIdentityStoreService } from '@services/tenant/tenant-identity-store.service';
import { LayoutService } from './service/app.layout.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, ButtonModule, MenuModule],
  templateUrl: './app.topbar.component.html'
})
export class AppTopbarComponent {
  readonly layoutService = inject(LayoutService);
  readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly tenantIdentityStore = inject(TenantIdentityStoreService);
  readonly profileMenuItems: MenuItem[] = [
    {
      label: 'Logout',
      icon: 'pi pi-power-off',
      command: () => this.onLogout()
    }
  ];

  onMenuButtonClick(): void {
    this.layoutService.onMenuToggle();
  }

  onLogout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
