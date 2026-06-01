import { ApplicationConfig, provideAppInitializer, inject, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { authInterceptor } from '@core/auth/auth.interceptor';
import { ThemeConfigService } from '@core/theming/theme-config.service';
import { TenantIdentityStoreService } from '@services/tenant/tenant-identity-store.service';
import appTheme from './app.theme';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideAppInitializer(() => {
      const themeConfigService = inject(ThemeConfigService);
      const tenantIdentityStore = inject(TenantIdentityStoreService);

      themeConfigService.setupThemeAndAssets();

      return tenantIdentityStore.initialize();
    }),
    provideAnimationsAsync(),
    ConfirmationService,
    MessageService,
    providePrimeNG({
      theme: appTheme,
      ripple: true,
      inputStyle: 'outlined'
    })
  ]
};
