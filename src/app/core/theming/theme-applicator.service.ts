import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { StyleManagerService } from './style-manager.service';
import { ThemingService } from './theming.service';
import { AssetsConfig } from './theming.types';

@Injectable({
  providedIn: 'root'
})
export class ThemeApplicatorService {
  private readonly styleManager = inject(StyleManagerService);
  private readonly themingService = inject(ThemingService);
  private readonly titleService = inject(Title);

  applyConfiguration(tenantKey: string, theme: string | null | undefined, assetsConfig: AssetsConfig | null | undefined, siteTitle: string | undefined): void {
    if (theme) {
      this.themingService.switchTheme(theme);
    }

    if (assetsConfig?.styleSheet) {
      this.styleManager.loadStyle(tenantKey, `/assets/tenants/${tenantKey}/${assetsConfig.styleSheet}`);
    }

    if (assetsConfig?.favicon) {
      this.setFavicon(`/assets/tenants/${tenantKey}/${assetsConfig.favicon}`);
    }

    if (siteTitle) {
      this.titleService.setTitle(siteTitle);
    }
  }

  setFavicon(faviconPath: string): void {
    const oldLink = document.querySelector("link[rel*='icon']");
    const link = document.createElement('link');

    link.rel = 'icon';
    link.type = faviconPath.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
    link.href = `${faviconPath}?v=${Date.now()}`;

    oldLink?.remove();
    document.head.appendChild(link);
  }
}
