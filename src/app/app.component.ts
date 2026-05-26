import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastModule } from 'primeng/toast';

import { ThemeConfigService } from '@core/theming/theme-config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  private readonly themeConfigService = inject(ThemeConfigService);

  ngOnInit(): void {
    this.themeConfigService.setupThemeAndAssets();
  }
}
