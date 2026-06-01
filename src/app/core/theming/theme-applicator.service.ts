import { Injectable, inject } from '@angular/core';

import { ThemingService } from './theming.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeApplicatorService {
  private readonly themingService = inject(ThemingService);

  applyConfiguration(theme: string | null | undefined): void {
    if (theme) {
      this.themingService.switchTheme(theme);
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
