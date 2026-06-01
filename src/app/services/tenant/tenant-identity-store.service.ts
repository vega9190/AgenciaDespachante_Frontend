import { Injectable, computed, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { ThemeApplicatorService } from '@core/theming/theme-applicator.service';
import { TenantIdentityDto } from './tenant-settings.types';
import { TenantSettingsService } from './tenant-settings.service';

const DEFAULT_TENANT_NAME = 'Transportadora';
const DEFAULT_LOGO_URL = '/assets/branding/logo.svg';
const DEFAULT_FAVICON_URL = '/assets/branding/favicon.svg';

@Injectable({
  providedIn: 'root'
})
export class TenantIdentityStoreService {
  private readonly tenantSettingsService = inject(TenantSettingsService);
  private readonly themeApplicatorService = inject(ThemeApplicatorService);
  private readonly titleService = inject(Title);
  private readonly identityState = signal<TenantIdentityDto>({
    name: DEFAULT_TENANT_NAME,
    logoDataUrl: null,
    favIcoDataUrl: null
  });

  readonly identity = this.identityState.asReadonly();
  readonly name = computed(() => this.identityState().name || DEFAULT_TENANT_NAME);
  readonly logoUrl = computed(() => this.identityState().logoDataUrl || DEFAULT_LOGO_URL);

  async initialize(): Promise<void> {
    try {
      const response = await firstValueFrom(this.tenantSettingsService.getIdentity());

      if (response.isValid && response.data) {
        this.identityState.set({
          name: response.data.name || DEFAULT_TENANT_NAME,
          logoDataUrl: response.data.logoDataUrl,
          favIcoDataUrl: response.data.favIcoDataUrl
        });
      }
    } finally {
      this.titleService.setTitle(this.name());
      this.themeApplicatorService.setFavicon(this.identityState().favIcoDataUrl || DEFAULT_FAVICON_URL);
    }
  }
}
