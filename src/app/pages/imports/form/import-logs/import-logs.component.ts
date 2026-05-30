import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { TableLazyLoadEvent, TableModule } from 'primeng/table';

import { ImportLogListItemDto } from '@services/imports/imports.types';
import { ImportsService } from '@services/imports/imports.service';

@Component({
  selector: 'app-import-logs',
  standalone: true,
  imports: [DatePipe, TableModule],
  templateUrl: './import-logs.component.html'
})
export class ImportLogsComponent {
  private readonly importsService = inject(ImportsService);

  readonly importId = input.required<string>();
  readonly refreshVersion = input(0);

  readonly pageSizeOptions = [10, 20, 50];
  readonly isLoading = signal(false);
  readonly logs = signal<ImportLogListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly first = computed(() => (this.page() - 1) * this.pageSize());

  constructor() {
    effect(() => {
      this.importId();
      this.refreshVersion();
      this.page.set(1);
      this.loadLogs();
    });
  }

  onPageChange(event: TableLazyLoadEvent): void {
    const rows = event.rows ?? this.pageSize();
    const first = event.first ?? 0;

    this.pageSize.set(rows);
    this.page.set(Math.floor(first / rows) + 1);
    this.loadLogs();
  }

  private loadLogs(): void {
    this.isLoading.set(true);

    this.importsService
      .getLogs(this.importId(), {
        page: this.page(),
        pageSize: this.pageSize()
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.logs.set(response.data?.items ?? []);
        this.totalItems.set(response.data?.totalItems ?? 0);
      });
  }
}
