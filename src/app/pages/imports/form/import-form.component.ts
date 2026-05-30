import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

import { IMPORT_STATUS_IDS, IMPORT_TIMELINE_STEPS } from '@services/imports/import-status.constants';
import { CONTAINER_TYPE_OPTIONS, ImportDetailDto, ImportDocumentTypeOptionDto } from '@services/imports/imports.types';
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
  readonly isLoadingDocumentTypes = signal(false);
  readonly documentTypeOptions = signal<ImportDocumentTypeOptionDto[]>([]);
  readonly containerTypeOptions = CONTAINER_TYPE_OPTIONS;
  readonly importTimelineSteps = IMPORT_TIMELINE_STEPS;
  readonly activeEditTab = signal('details');
  readonly isEditMode = computed(() => this.importId() !== null);
  readonly pageTitle = computed(() => (this.isEditMode() ? 'Editar Importación' : 'Crear Importación'));
  readonly requiredTimelineDocumentNames = computed(() => {
    const currentImport = this.importItem();

    if (!currentImport) {
      return [];
    }

    const documentTypeOptionsById = new Map(this.documentTypeOptions().map((documentType) => [documentType.id, documentType.name]));

    return [...currentImport.importDocumentTypeRequireds]
      .filter((requiredDocumentType) => requiredDocumentType.isRequired)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((requiredDocumentType) => documentTypeOptionsById.get(requiredDocumentType.importDocumentTypeId))
      .filter((documentName): documentName is string => !!documentName);
  });
  readonly timelineLegend = computed(() => {
    const currentImport = this.importItem();

    if (!currentImport) {
      return null;
    }

    const normalizedStatusId = currentImport.statusId?.toLowerCase();

    if (!normalizedStatusId || normalizedStatusId === IMPORT_STATUS_IDS.finalizado.toLowerCase() || this.isCancelledStatus(normalizedStatusId)) {
      return null;
    }

    if (normalizedStatusId === IMPORT_STATUS_IDS.nuevo.toLowerCase()) {
      return 'Para avanzar: Subir un documento';
    }

    if (this.requiresDocumentApprovalLegend(normalizedStatusId)) {
      const documentNames = this.requiredTimelineDocumentNames().join(', ');

      return documentNames ? `Para avanzar: Aprobar los documentos ${documentNames}` : 'Para avanzar: Aprobar los documentos';
    }

    return null;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      this.importId.set(id);

      if (id) {
        this.loadImport(id);
        this.loadDocumentTypeOptions(id);
        return;
      }

      this.importItem.set(null);
      this.documentTypeOptions.set([]);
    });
  }

  onImportChanged(importItem: ImportDetailDto): void {
    this.importItem.set(importItem);
    this.loadDocumentTypeOptions(importItem.id);
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

  private requiresDocumentApprovalLegend(statusId: string): boolean {
    const normalizedStatusId = statusId.toLowerCase();

    return [IMPORT_STATUS_IDS.enProceso, IMPORT_STATUS_IDS.declaracion, IMPORT_STATUS_IDS.autorizado].some(
      (currentStatusId) => currentStatusId.toLowerCase() === normalizedStatusId
    );
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

  private loadDocumentTypeOptions(id: string): void {
    this.isLoadingDocumentTypes.set(true);

    this.importsService
      .getDocumentTypeOptionsByImportId(id)
      .pipe(finalize(() => this.isLoadingDocumentTypes.set(false)))
      .subscribe((response) => {
        this.documentTypeOptions.set(response.data ?? []);
      });
  }
}
