import { Component, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-kpi-stat-card',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './kpi-stat-card.component.html',
  styleUrl: './kpi-stat-card.component.css'
})
export class AppKpiStatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly icon = input('pi pi-chart-bar');
  readonly format = input<'currency' | 'number' | 'days'>('number');
  readonly currencyCode = input('USD');
  readonly severity = input<'info' | 'success' | 'warn' | 'danger'>('info');
}
