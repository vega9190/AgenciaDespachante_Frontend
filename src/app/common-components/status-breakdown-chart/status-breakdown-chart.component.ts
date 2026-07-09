import { Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

export interface StatusBreakdownItem {
  label: string;
  value: number;
}

interface StatusBreakdownRow extends StatusBreakdownItem {
  color: string;
  percent: number;
}

const PALETTE = ['#2563EB', '#7C3AED', '#16A34A', '#F59E0B', '#DC2626', '#6B7280'];

@Component({
  selector: 'app-status-breakdown-chart',
  imports: [CardModule, NgxEchartsDirective, CurrencyPipe, DecimalPipe],
  templateUrl: './status-breakdown-chart.component.html',
  styleUrl: './status-breakdown-chart.component.css'
})
export class AppStatusBreakdownChartComponent {
  readonly title = input.required<string>();
  readonly items = input.required<StatusBreakdownItem[]>();
  readonly chartType = input<'pie' | 'bar'>('pie');
  readonly valueFormat = input<'number' | 'currency'>('number');
  readonly currencyCode = input('USD');
  readonly loading = input(false);

  readonly totalValue = computed(() => this.items().reduce((sum, i) => sum + i.value, 0));

  readonly rows = computed<StatusBreakdownRow[]>(() => {
    const total = this.totalValue();

    return this.items().map((item, index) => ({
      ...item,
      color: PALETTE[index % PALETTE.length],
      percent: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));
  });

  readonly chartOptions = computed<EChartsCoreOption>(() => ({
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        data: this.rows().map((r) => ({ name: r.label, value: r.value, itemStyle: { color: r.color } }))
      }
    ]
  }));
}
