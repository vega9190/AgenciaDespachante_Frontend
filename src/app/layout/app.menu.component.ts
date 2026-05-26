import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

import { LayoutService } from './service/app.layout.service';

interface MenuItemDto {
  label: string;
  icon: string;
  routerLink: string[];
}

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive, TooltipModule],
  templateUrl: './app.menu.component.html'
})
export class AppMenuComponent {
  readonly layoutService = inject(LayoutService);

  readonly menuItems: MenuItemDto[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: ['/dashboard']
    },
    {
      label: 'Clientes',
      icon: 'pi pi-users',
      routerLink: ['/clients']
    },
    {
      label: 'Pedidos',
      icon: 'pi pi-clipboard',
      routerLink: ['/orders']
    }
  ];
}
