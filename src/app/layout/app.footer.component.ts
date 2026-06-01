import { Component, inject } from '@angular/core';

import { TenantIdentityStoreService } from '@services/tenant/tenant-identity-store.service';

@Component({
  selector: 'app-footer',
  templateUrl: './app.footer.component.html'
})
export class AppFooterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly tenantIdentityStore = inject(TenantIdentityStoreService);
}
