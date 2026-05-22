import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '@core/auth/auth.service';
import { ThemeConfigService } from '@core/theming/theme-config.service';
import { LayoutService } from './service/app.layout.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, ButtonModule],
  templateUrl: './app.topbar.component.html'
})
export class AppTopbarComponent {
  readonly layoutService = inject(LayoutService);
  readonly authService = inject(AuthService);
  readonly themeConfigService = inject(ThemeConfigService);

  onMenuButtonClick(): void {
    this.layoutService.onMenuToggle();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
