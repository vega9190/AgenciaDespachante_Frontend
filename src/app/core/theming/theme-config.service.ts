import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import { defaultTenantConfig } from './config/tenant-definitions.config';
import { resolveTenantConfig } from './config/tenant-resolver.config';
import { ThemeApplicatorService } from './theme-applicator.service';
import { ClientConfig } from './theming.types';

@Injectable({
  providedIn: 'root'
})
export class ThemeConfigService {
  private readonly document = inject(DOCUMENT);
  private readonly themeApplicator = inject(ThemeApplicatorService);

  readonly currentConfig = signal<ClientConfig>(defaultTenantConfig);

  setupThemeAndAssets(): void {
    const hostname = this.document.location.hostname;
    const config = resolveTenantConfig(hostname);

    this.currentConfig.set(config);
    this.themeApplicator.applyConfiguration(config.key, config.theme, config.assetsConfig, config.siteTitle ?? config.loginTitle);
  }
}
