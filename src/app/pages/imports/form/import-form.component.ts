import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';

import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { IMPORT_STATUS_IDS, IMPORT_TIMELINE_STEPS, isCancelledImportStatus, isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import { CONTAINER_TYPE_OPTIONS, ImportDetailDto, ImportDocumentTypeOptionDto } from '@services/imports/imports.types';
import { ImportsService } from '@services/imports/imports.service';
import { ImportDetailsComponent } from './import-details/import-details.component';
import { ImportDocumentsComponent } from './import-documents/import-documents.component';
import { ImportLogsComponent } from './import-logs/import-logs.component';
import { ImportPaymentsComponent } from './import-payments/import-payments.component';
import { ImportTransportationComponent } from './import-transportation/import-transportation.component';

@Component({
  selector: 'app-import-form',
  imports: [ButtonModule, DatePipe, CardModule, ConfirmDialogModule, Tabs, TabList, Tab, TabPanels, TabPanel, TooltipModule, ImportDetailsComponent, ImportDocumentsComponent, ImportPaymentsComponent, ImportLogsComponent, ImportTransportationComponent],
  templateUrl: './import-form.component.html',
  styleUrl: './import-form.component.css'
})
export class ImportFormComponent {
  private readonly importsService = inject(ImportsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = signal(false);
  readonly isUpdatingStatus = signal(false);
  readonly importItem = signal<ImportDetailDto | null>(null);
  readonly importId = signal<string | null>(null);
  readonly isLoadingDocumentTypes = signal(false);
  readonly documentTypeOptions = signal<ImportDocumentTypeOptionDto[]>([]);
  readonly containerTypeOptions = CONTAINER_TYPE_OPTIONS;
  readonly importTimelineSteps = IMPORT_TIMELINE_STEPS;
  readonly activeEditTab = signal('details');
  readonly logsRefreshVersion = signal(0);
  readonly isEditMode = computed(() => this.importId() !== null);
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importItem()?.statusId));
  readonly canCancelImport = computed(() => !!this.importItem() && !this.isReadOnly() && !this.isUpdatingStatus());
  readonly pageTitle = computed(() => {
    if (!this.isEditMode()) {
      return 'Crear Importación';
    }

    const importNumber = this.importItem()?.importNumber;
    return importNumber ? `Editar Importación - #${importNumber}` : 'Editar Importación';
  });
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
  readonly timelineLegendPrefix = 'Para avanzar:';
  readonly timelineLegend = computed(() => {
    const currentImport = this.importItem();

    if (!currentImport) {
      return null;
    }

    const normalizedStatusId = currentImport.statusId?.toLowerCase();

    if (!normalizedStatusId || normalizedStatusId === IMPORT_STATUS_IDS.finalizado.toLowerCase() || isCancelledImportStatus(normalizedStatusId)) {
      return null;
    }

    if (normalizedStatusId === IMPORT_STATUS_IDS.nuevo.toLowerCase()) {
      return 'Subir un documento';
    }

    if (this.requiresDocumentApprovalLegend(normalizedStatusId)) {
      const documentNames = this.requiredTimelineDocumentNames().join(', ');

      return documentNames ? `Aprobar los documentos ${documentNames}` : 'Aprobar los documentos';
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
    this.refreshLogs();
    this.loadDocumentTypeOptions(importItem.id);
  }

  refreshLogs(): void {
    this.logsRefreshVersion.update((current) => current + 1);
  }

  getCurrentTimelineStepIndex(statusId: string | null | undefined): number {
    if (!statusId || isCancelledImportStatus(statusId)) {
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

  isFinalizedTimelineStep(stepIndex: number, currentStepIndex: number, statusId: string | null | undefined): boolean {
    if (!statusId) {
      return false;
    }

    return stepIndex === this.importTimelineSteps.length - 1
      && currentStepIndex === stepIndex
      && statusId.toLowerCase() === IMPORT_STATUS_IDS.finalizado.toLowerCase();
  }

  getTimelineConnectorState(stepIndex: number, currentStepIndex: number): 'completed' | 'pending' {
    return currentStepIndex > stepIndex ? 'completed' : 'pending';
  }

  onCancelImport(): void {
    const currentImport = this.importItem();

    if (!currentImport || !this.canCancelImport()) {
      return;
    }

    this.confirmationService.confirm({
      header: 'Cancelar importación',
      message: '¿Está seguro de cancelar la importación?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancelImport(currentImport.id)
    });
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

  private cancelImport(id: string): void {
    this.isUpdatingStatus.set(true);
    this.uiBlockService.block();

    this.importsService
      .updateStatus(id, { statusId: IMPORT_STATUS_IDS.cancelado })
      .pipe(
        finalize(() => {
          this.isUpdatingStatus.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!response?.isValid) {
          return;
        }

        this.refreshLogs();
        this.loadImport(id);
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
