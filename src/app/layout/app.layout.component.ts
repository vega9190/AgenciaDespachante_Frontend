import { Component, OnDestroy, Renderer2, RendererFactory2, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { AppFooterComponent } from './app.footer.component';
import { AppSidebarComponent } from './app.sidebar.component';
import { AppTopbarComponent } from './app.topbar.component';
import { LayoutService } from './service/app.layout.service';
import { UiBlockService } from '@services/common/ui-block.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, AppTopbarComponent, AppSidebarComponent, AppFooterComponent],
  templateUrl: './app.layout.component.html'
})
export class AppLayoutComponent implements OnDestroy {
  readonly layoutService = inject(LayoutService);
  readonly uiBlockService = inject(UiBlockService);
  private readonly rendererFactory = inject(RendererFactory2);
  private readonly router = inject(Router);
  private readonly renderer: Renderer2;

  private menuOutsideClickListener: (() => void) | null = null;
  private readonly routeSubscription: Subscription;
  private readonly overlaySubscription: Subscription;

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);

    this.overlaySubscription = this.layoutService.overlayOpen$.subscribe(() => {
      if (!this.menuOutsideClickListener) {
        this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event: Event) => {
          const target = event.target as HTMLElement | null;

          if (target?.closest('.layout-sidebar, .topbar-menubutton')) {
            return;
          }

          this.hideMenu();
        });
      }

      if (this.layoutService.state.staticMenuMobileActive) {
        document.body.classList.add('blocked-scroll');
      }
    });

    this.routeSubscription = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.hideMenu());
  }

  get containerClass(): Record<string, boolean> {
    return {
      'layout-static': this.layoutService.config.menuMode === 'static',
      'layout-mobile-active': this.layoutService.state.staticMenuMobileActive,
      'layout-static-inactive': this.layoutService.state.staticMenuDesktopInactive,
      'p-input-filled': this.layoutService.config.inputStyle === 'filled',
      'layout-light': this.layoutService.config.layoutTheme === 'primaryColor' && this.layoutService.config.colorScheme === 'light',
      'layout-primary': this.layoutService.config.layoutTheme === 'primaryColor'
    };
  }

  hideMenu(): void {
    this.layoutService.state.overlayMenuActive = false;
    this.layoutService.state.staticMenuMobileActive = false;
    document.body.classList.remove('blocked-scroll');

    if (this.menuOutsideClickListener) {
      this.menuOutsideClickListener();
      this.menuOutsideClickListener = null;
    }
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    this.overlaySubscription.unsubscribe();
    this.menuOutsideClickListener?.();
  }
}
