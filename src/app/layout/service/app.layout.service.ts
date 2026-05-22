import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type MenuMode = 'static' | 'overlay';
export type ColorScheme = 'light' | 'dark';

export interface AppConfig {
  inputStyle: string;
  colorScheme: ColorScheme;
  ripple: boolean;
  menuMode: MenuMode;
  layoutTheme: string;
}

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  staticMenuMobileActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  readonly config: AppConfig = {
    ripple: true,
    inputStyle: 'outlined',
    menuMode: 'static',
    colorScheme: 'light',
    layoutTheme: 'primaryColor'
  };

  readonly state: LayoutState = {
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    staticMenuMobileActive: false
  };

  private readonly overlayOpen = new Subject<void>();
  readonly overlayOpen$ = this.overlayOpen.asObservable();

  onMenuToggle(): void {
    if (this.isDesktop()) {
      this.state.staticMenuDesktopInactive = !this.state.staticMenuDesktopInactive;
      return;
    }

    this.state.staticMenuMobileActive = !this.state.staticMenuMobileActive;

    if (this.state.staticMenuMobileActive) {
      this.overlayOpen.next();
    }
  }

  isDesktop(): boolean {
    return window.innerWidth > 991;
  }
}
