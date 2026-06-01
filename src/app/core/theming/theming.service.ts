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
    const primaryColor = theme.secondaryColor;
    const primaryHoverColor = theme.secondaryHoverColor;
    const primaryActiveColor = theme.secondaryActiveColor;
    const formFieldHoverBorderColor = `color-mix(in srgb, ${theme.secondaryColor} 80%, ${theme.contentBorder})`;
    const formFieldFocusBorderColor = `color-mix(in srgb, ${theme.secondaryColor} 0%, ${theme.contentBorder})`;
    const formFieldFocusRingShadow = `0 0 0 0 color-mix(in srgb, ${theme.secondaryColor} 10%, transparent)`;

    root.style.setProperty('--p-primary-color', primaryColor);
    root.style.setProperty('--p-primary-hover-color', primaryHoverColor);
    root.style.setProperty('--p-primary-active-color', primaryActiveColor);
    root.style.setProperty('--p-primary-contrast-color', theme.secondaryContrastColor);
    root.style.setProperty('--p-button-primary-background', primaryColor);
    root.style.setProperty('--p-button-primary-hover-background', primaryHoverColor);
    root.style.setProperty('--p-button-primary-active-background', primaryActiveColor);
    root.style.setProperty('--p-button-primary-border-color', primaryColor);
    root.style.setProperty('--p-button-primary-hover-border-color', primaryHoverColor);
    root.style.setProperty('--p-button-primary-active-border-color', primaryActiveColor);
    root.style.setProperty('--p-button-primary-color', theme.secondaryContrastColor);
    root.style.setProperty('--p-button-primary-hover-color', theme.secondaryContrastColor);
    root.style.setProperty('--p-button-primary-active-color', theme.secondaryContrastColor);
    root.style.setProperty('--p-checkbox-checked-background', primaryColor);
    root.style.setProperty('--p-checkbox-checked-hover-background', primaryHoverColor);
    root.style.setProperty('--p-checkbox-checked-border-color', primaryColor);
    root.style.setProperty('--p-checkbox-checked-hover-border-color', primaryHoverColor);
    root.style.setProperty('--p-checkbox-icon-checked-color', theme.secondaryContrastColor);
    root.style.setProperty('--p-radiobutton-checked-border-color', primaryColor);
    root.style.setProperty('--p-radiobutton-checked-hover-border-color', primaryHoverColor);
    root.style.setProperty('--p-radiobutton-icon-checked-color', primaryColor);
    root.style.setProperty('--p-togglebutton-checked-background', primaryColor);
    root.style.setProperty('--p-togglebutton-checked-hover-background', primaryHoverColor);
    root.style.setProperty('--p-togglebutton-checked-border-color', primaryColor);
    root.style.setProperty('--p-togglebutton-checked-hover-border-color', primaryHoverColor);
    root.style.setProperty('--p-togglebutton-content-checked-color', theme.secondaryContrastColor);
    root.style.setProperty('--p-link-color', primaryColor);
    root.style.setProperty('--p-link-hover-color', primaryHoverColor);
    root.style.setProperty('--p-highlight-background', `color-mix(in srgb, ${primaryColor} 12%, white)`);
    root.style.setProperty('--p-highlight-focus-background', `color-mix(in srgb, ${primaryColor} 18%, white)`);
    root.style.setProperty('--p-highlight-color', primaryColor);
    root.style.setProperty('--p-highlight-focus-color', primaryActiveColor);
    root.style.setProperty('--p-tabs-tab-active-color', primaryColor);
    root.style.setProperty('--p-tabs-active-bar-background', primaryColor);
    root.style.setProperty('--p-form-field-border-color', theme.contentBorder);
    root.style.setProperty('--p-form-field-hover-border-color', formFieldHoverBorderColor);
    root.style.setProperty('--p-form-field-focus-border-color', formFieldFocusBorderColor);
    root.style.setProperty('--p-form-field-focus-ring-width', '1px');
    root.style.setProperty('--p-form-field-focus-ring-style', 'solid');
    root.style.setProperty('--p-form-field-focus-ring-color', primaryColor);
    root.style.setProperty('--p-form-field-focus-ring-offset', '0');
    root.style.setProperty('--p-form-field-focus-ring-shadow', formFieldFocusRingShadow);
    root.style.setProperty('--p-form-field-icon-color', 'var(--p-text-secondary-color)');
    root.style.setProperty('--p-inputtext-border-color', theme.contentBorder);
    root.style.setProperty('--p-inputtext-hover-border-color', formFieldHoverBorderColor);
    root.style.setProperty('--p-inputtext-focus-border-color', formFieldFocusBorderColor);
    root.style.setProperty('--p-inputtext-focus-ring-width', '1px');
    root.style.setProperty('--p-inputtext-focus-ring-style', 'solid');
    root.style.setProperty('--p-inputtext-focus-ring-color', primaryColor);
    root.style.setProperty('--p-inputtext-focus-ring-offset', '0');
    root.style.setProperty('--p-inputtext-focus-ring-shadow', formFieldFocusRingShadow);
    root.style.setProperty('--tenant-secondary', theme.secondaryColor);
    root.style.setProperty('--tenant-secondary-hover', theme.secondaryHoverColor);
    root.style.setProperty('--tenant-secondary-active', theme.secondaryActiveColor);
    root.style.setProperty('--tenant-secondary-contrast', theme.secondaryContrastColor);
    root.style.setProperty('--tenant-tertiary', theme.tertiaryColor);
    root.style.setProperty('--tenant-tertiary-hover', theme.tertiaryHoverColor);
    root.style.setProperty('--tenant-tertiary-active', theme.tertiaryActiveColor);
    root.style.setProperty('--tenant-tertiary-contrast', theme.tertiaryContrastColor);
    root.style.setProperty('--tenant-layout-background', theme.layoutBackground);
    root.style.setProperty('--tenant-layout-surface', theme.layoutSurface);
    root.style.setProperty('--tenant-layout-overlay-surface', theme.layoutSurfaceOverlay);
    root.style.setProperty('--tenant-layout-border', theme.layoutBorder);
    root.style.setProperty('--tenant-layout-highlight', theme.layoutHighlight);
    root.style.setProperty('--tenant-layout-text', theme.layoutText);
    root.style.setProperty('--tenant-layout-text-muted', theme.layoutTextMuted);
    root.style.setProperty('--tenant-content-background', theme.contentBackground);
    root.style.setProperty('--tenant-content-border', theme.contentBorder);
    root.style.setProperty('--tenant-content-shadow', theme.contentShadow);
    root.style.setProperty('--tenant-overlay-shadow', theme.overlayShadow);
    root.style.setProperty('--tenant-overlay-backdrop', theme.overlayBackdrop);
    root.style.setProperty('--tenant-success-color', theme.successColor);
    root.style.setProperty('--tenant-success-surface', theme.successSurface);
    root.style.setProperty('--tenant-danger-color', theme.dangerColor);
    root.style.setProperty('--tenant-danger-surface', theme.dangerSurface);
  }
}
