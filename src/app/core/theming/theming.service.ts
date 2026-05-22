import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { updatePrimaryPalette } from '@primeng/themes';

import { themes } from './config/themings.config';
import { Theme } from './theming.types';

@Injectable({
  providedIn: 'root'
})
export class ThemingService {
  private readonly document = inject(DOCUMENT);
  private readonly themeCacheKey = 'frontend-seed-theme';

  constructor() {
    this.initializeTheme();
  }

  switchTheme(themeName: string): void {
    const theme = themes[themeName];

    if (!theme) {
      return;
    }

    updatePrimaryPalette(theme.palette);
    this.updateSemanticColors(theme);
    this.document.defaultView?.localStorage.setItem(this.themeCacheKey, themeName);
  }

  private initializeTheme(): void {
    const savedThemeName = this.document.defaultView?.localStorage.getItem(this.themeCacheKey) ?? 'default';
    this.switchTheme(savedThemeName);
  }

  private updateSemanticColors(theme: Theme): void {
    const root = this.document.documentElement;
    const primaryShade = Number(theme.primaryShade);
    const hoverShade = Math.min(primaryShade + 100, 950);
    const activeShade = Math.min(primaryShade + 200, 950);

    root.style.setProperty('--p-primary-color', `var(--p-primary-${primaryShade})`);
    root.style.setProperty('--p-primary-hover-color', `var(--p-primary-${hoverShade})`);
    root.style.setProperty('--p-primary-active-color', `var(--p-primary-${activeShade})`);
  }
}
