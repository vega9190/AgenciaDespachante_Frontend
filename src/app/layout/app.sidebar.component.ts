import { Component } from '@angular/core';

import { AppMenuComponent } from './app.menu.component';

@Component({
  selector: 'app-sidebar',
  imports: [AppMenuComponent],
  templateUrl: './app.sidebar.component.html'
})
export class AppSidebarComponent {}
