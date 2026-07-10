import { Component, computed, inject, signal } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '@core/auth/auth.service';
import { RoleIds } from '@core/auth/role.constants';

import { LayoutService } from './service/app.layout.service';

interface MenuItemDto {
  label: string;
  icon: string;
  routerLink?: string[];
  items?: MenuItemDto[];
  roles?: string[];
}

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive, TooltipModule],
  templateUrl: './app.menu.component.html'
})
export class AppMenuComponent {
  readonly layoutService = inject(LayoutService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly expandedItems = signal<Record<string, boolean>>({});
  private readonly hoveredItemLabel = signal<string | null>(null);

  private readonly childRouteMatchOptions: IsActiveMatchOptions = {
    paths: 'subset',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored'
  };

  private readonly managerRoles = [RoleIds.Administrator, RoleIds.Manager];

  readonly menuItems: MenuItemDto[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: ['/dashboard'],
      roles: [RoleIds.Administrator]
    },
    {
      label: 'Clientes',
      icon: 'pi pi-users',
      routerLink: ['/clients'],
      roles: this.managerRoles
    },
    {
      label: 'Choferes',
      icon: 'pi pi-id-card',
      routerLink: ['/drivers'],
      roles: this.managerRoles
    },
    {
      label: 'Importaciones',
      icon: 'pi pi-clipboard',
      routerLink: ['/imports']
    },
    {
      label: 'Herramientas',
      icon: 'pi pi-wrench',
      roles: this.managerRoles,
      items: [
        {
          label: 'Cotización',
          icon: 'pi pi-dollar',
          routerLink: ['/tools', 'quotation']
        },
        {
          label: 'Generar DAM',
          icon: 'pi pi-file-edit',
          routerLink: ['/tools', 'generate-dam']
        },
        {
          label: 'Partida Arancelaria',
          icon: 'pi pi-tags',
          routerLink: ['/tools', 'tariff-item']
        }
      ]
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      routerLink: ['/settings'],
      roles: this.managerRoles
    }
  ];

  readonly visibleMenuItems = computed(() => this.menuItems.filter((item) => !item.roles || this.authService.hasRole(...item.roles)));

  isExpanded(item: MenuItemDto): boolean {
    if (this.layoutService.isDesktop()) {
      return this.hoveredItemLabel() === item.label;
    }

    return this.expandedItems()[item.label] ?? false;
  }

  toggleItem(item: MenuItemDto): void {
    if (!item.items?.length || this.layoutService.isDesktop()) {
      return;
    }

    this.expandedItems.update((state) => ({
      ...state,
      [item.label]: !this.isExpanded(item)
    }));
  }

  hasActiveChild(item: MenuItemDto): boolean {
    return item.items?.some((child) => !!child.routerLink && this.router.isActive(this.router.createUrlTree(child.routerLink), this.childRouteMatchOptions)) ?? false;
  }

  onChildSelect(item: MenuItemDto): void {
    this.hoveredItemLabel.set(null);

    if (!item.items?.length) {
      return;
    }

    this.expandedItems.update((state) => ({
      ...state,
      [item.label]: false
    }));
  }

  onParentMouseEnter(item: MenuItemDto): void {
    if (!this.layoutService.isDesktop() || !item.items?.length) {
      return;
    }

    this.hoveredItemLabel.set(item.label);
  }

  onParentMouseLeave(item: MenuItemDto): void {
    if (!this.layoutService.isDesktop() || this.hoveredItemLabel() !== item.label) {
      return;
    }

    this.hoveredItemLabel.set(null);
  }
}
