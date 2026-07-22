import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { formatDateForBackend } from '../../functions/common.function';
import { DashboardService } from '@services/dashboards/dashboard.service';
import { DashboardFinancialSummaryDto, DashboardLogisticsSummaryDto, DashboardSummaryQuery } from '@services/dashboards/dashboards.types';
import { IMPORT_PAYMENT_TYPE_OPTIONS } from '@services/imports/imports.types';

import { AppKpiStatCardComponent } from '../../common-components/kpi-stat-card/kpi-stat-card.component';
import { AppStatusBreakdownChartComponent } from '../../common-components/status-breakdown-chart/status-breakdown-chart.component';
import { ResponsiveTableDirective } from '../../common-components/responsive-table/responsive-table.directive';

interface RangeOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CardModule, SelectModule, TableModule, TagModule, DatePipe, FormsModule, AppKpiStatCardComponent, AppStatusBreakdownChartComponent, ResponsiveTableDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly rangeOptions: RangeOption[] = [
    { label: 'Mes actual', value: 1 },
    { label: '2 meses', value: 2 },
    { label: '3 meses', value: 3 }
  ];

  readonly selectedMonths = signal(1);
  readonly isLoading = signal(false);
  readonly financialSummary = signal<DashboardFinancialSummaryDto | null>(null);
  readonly logisticsSummary = signal<DashboardLogisticsSummaryDto | null>(null);

  readonly importsByStatusItems = computed(() =>
    (this.financialSummary()?.importsByStatus ?? []).map((s) => ({ label: s.statusName, value: s.count }))
  );

  readonly paymentsByTypeItems = computed(() =>
    (this.financialSummary()?.paymentsByType ?? []).map((p) => ({
      label: IMPORT_PAYMENT_TYPE_OPTIONS.find((o) => o.value === p.type)?.label ?? String(p.type),
      value: p.totalAmount
    }))
  );

  readonly shipmentsByStatusItems = computed(() =>
    (this.logisticsSummary()?.shipmentsByStatus ?? []).map((s) => ({ label: s.statusName, value: s.count }))
  );

  readonly expiringDrivers = computed(() =>
    [...(this.logisticsSummary()?.driversTransportCardExpiringSoon ?? [])].sort((a, b) => a.daysRemaining - b.daysRemaining)
  );

  constructor() {
    this.loadDashboard();
  }

  driverExpirationSeverity(daysRemaining: number): 'danger' | 'warn' | 'info' {
    if (daysRemaining <= 7) {
      return 'danger';
    }

    if (daysRemaining <= 15) {
      return 'warn';
    }

    return 'info';
  }

  onRangeChange(months: number): void {
    this.selectedMonths.set(months);
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);

    const query = this.buildQuery();

    forkJoin({
      financial: this.dashboardService.getFinancialSummary(query),
      logistics: this.dashboardService.getLogisticsSummary(query)
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(({ financial, logistics }) => {
        this.financialSummary.set(financial.data);
        this.logisticsSummary.set(logistics.data);
      });
  }

  private buildQuery(): DashboardSummaryQuery {
    const today = new Date();
    const dateFrom = new Date(today.getFullYear(), today.getMonth() - (this.selectedMonths() - 1), 1);

    return {
      dateFrom: formatDateForBackend(dateFrom) ?? undefined,
      dateTo: formatDateForBackend(today) ?? undefined
    };
  }
}
