import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

import { IMPORT_STATUS_IDS, IMPORT_TIMELINE_STEPS } from '@services/imports/import-status.constants';
import { CONTAINER_TYPE_OPTIONS, ImportDetailDto } from '@services/imports/imports.types';
import { ImportsService } from '@services/imports/imports.service';
import { ImportDetailsComponent } from './import-details/import-details.component';
import { ImportDocumentsComponent } from './import-documents/import-documents.component';
import { ImportPaymentsComponent } from './import-payments/import-payments.component';

@Component({
  selector: 'app-import-form',
  imports: [DatePipe, CardModule, ConfirmDialogModule, Tabs, TabList, Tab, TabPanels, TabPanel, ImportDetailsComponent, ImportDocumentsComponent, ImportPaymentsComponent],
  templateUrl: './import-form.component.html',
  styleUrl: './import-form.component.css'
})
export class ImportFormComponent {
  private readonly importsService = inject(ImportsService);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(false);
  readonly importItem = signal<ImportDetailDto | null>(null);
  readonly importId = signal<string | null>(null);
  readonly containerTypeOptions = CONTAINER_TYPE_OPTIONS;
  readonly importTimelineSteps = IMPORT_TIMELINE_STEPS;
  readonly activeEditTab = signal('details');
  readonly isEditMode = computed(() => this.importId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Importación' : 'Crear Importación'));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      this.importId.set(id);

      if (id) {
        this.loadImport(id);
        return;
      }

      this.importItem.set(null);
    });
  }

  onImportChanged(importItem: ImportDetailDto): void {
    this.importItem.set(importItem);
  }

  getCurrentTimelineStepIndex(statusId: string | null | undefined): number {
    if (!statusId || this.isCancelledStatus(statusId)) {
      return -1;
    }

    const normalizedStatusId = statusId.toLowerCase();
    return this.importTimelineSteps.findIndex((step) => step.statusId.toLowerCase() === normalizedStatusId);
  }

  isCompletedTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return currentStepIndex > -1 && stepIndex < currentStepIndex;
  }

  isCurrentTimelineStep(stepIndex: number, currentStepIndex: number): boolean {
    return currentStepIndex > -1 && stepIndex === currentStepIndex;
  }

  getTimelineConnectorState(stepIndex: number, currentStepIndex: number): 'completed' | 'pending' {
    return currentStepIndex > stepIndex ? 'completed' : 'pending';
  }

  private isCancelledStatus(statusId: string): boolean {
    return statusId.toLowerCase() === IMPORT_STATUS_IDS.cancelado.toLowerCase();
  }

  private loadImport(id: string): void {
    this.isLoading.set(true);

    this.importsService
      .getById(id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((response) => {
        this.importItem.set(response.data ?? null);
      });
  }
}
