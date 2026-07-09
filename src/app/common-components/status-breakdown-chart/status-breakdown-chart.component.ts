import { Component, computed, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';

export interface StatusBreakdownItem {
  label: string;
  value: number;
}

@Component({
  selector: 'app-status-breakdown-chart',
  imports: [CardModule, NgxEchartsDirective],
  templateUrl: './status-breakdown-chart.component.html',
  styleUrl: './status-breakdown-chart.component.css'
})
export class AppStatusBreakdownChartComponent {
  readonly title = input.required<string>();
  readonly items = input.required<StatusBreakdownItem[]>();
  readonly chartType = input<'pie' | 'bar'>('pie');
  readonly loading = input(false);

  readonly chartOptions = computed<EChartsCoreOption>(() => {
    const items = this.items();

    if (this.chartType() === 'bar') {
      return {
        tooltip: { trigger: 'axis' },
        grid: { left: 8, right: 8, top: 24, bottom: 24, containLabel: true },
        xAxis: { type: 'category', data: items.map((i) => i.label) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: items.map((i) => i.value) }]
      };
    }

    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: items.map((i) => ({ name: i.label, value: i.value }))
        }
      ]
    };
  });
}
