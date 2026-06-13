import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { FileSelectorComponent } from '../../../../common-components/file-selector/file-selector.component';
import { ApiResult, ApiResultOf } from '@models/api.types';
import { AppToastService } from '@services/common/app-toast.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import {
  ImportDetailDto,
  ImportDocumentCategory,
  ImportDocumentDto,
  ImportDocumentTypeOptionDto,
  ImportDocumentTypeRequiredDto
} from '@services/imports/imports.types';
import { ImportsService } from '@services/imports/imports.service';

import { IMPORT_DOCUMENT_TYPE_IDS } from '../../models/import-document-type.constants';
import { DocumentSectionItem, DocumentSectionVm } from '../import-form.types';

const DOCUMENT_STATUS = {
  aprobado: 1,
  enRevision: 2,
  faltante: 3
} as const;

const DEFAULT_DOCUMENT_FILE_ACCEPT = '.pdf,.xls,.xlsx,.jpg,.jpeg,.png';
const DEFAULT_DOCUMENT_FILE_HELPER_TEXT = 'Formatos permitidos: PDF, XLS, XLSX, JPG y PNG. Tamaño maximo: 5 MB.';
const IMAGE_DOCUMENT_FILE_ACCEPT = '.jpg,.jpeg,.png';
const IMAGE_DOCUMENT_FILE_HELPER_TEXT = 'Formatos permitidos: JPG, JPEG y PNG. Tamaño maximo: 5 MB.';

@Component({
  selector: 'app-import-documents',
  imports: [FormsModule, AccordionModule, ButtonModule, CardModule, SelectModule, TagModule, TooltipModule, FileSelectorComponent],
  templateUrl: './import-documents.component.html',
  styleUrl: './import-documents.component.css'
})
export class ImportDocumentsComponent {
  private readonly importsService = inject(ImportsService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly appToastService = inject(AppToastService);
  private readonly uiBlockService = inject(UiBlockService);

  readonly importId = input.required<string>();
  readonly importItem = input.required<ImportDetailDto>();
  readonly isLoadingDocumentTypes = input(false);
  readonly documentTypeOptions = input<ImportDocumentTypeOptionDto[]>([]);

  readonly importChanged = output<ImportDetailDto>();
  readonly logsChanged = output<void>();

  readonly isSavingDocument = signal(false);
  readonly documents = signal<ImportDocumentDto[]>([]);
  readonly requiredDocumentTypes = signal<ImportDocumentTypeRequiredDto[]>([]);
  readonly selectedDocumentTypeId = signal<string | null>(null);
  readonly selectedDocumentFile = signal<File | null>(null);
  readonly approveConfirmDocumentTypeId = signal<string | null>(null);
  readonly approvingDocumentTypeId = signal<string | null>(null);
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importItem().statusId));

  readonly canSaveDocument = computed(
    () =>
      !!this.importId() &&
      !!this.selectedDocumentTypeId() &&
      !!this.selectedDocumentFile() &&
      !this.isSavingDocument() &&
      !this.isLoadingDocumentTypes() &&
      !this.isReadOnly()
  );
  readonly selectedDocumentType = computed(
    () => this.documentTypeOptions().find((documentType) => documentType.id === this.selectedDocumentTypeId()) ?? null
  );
  readonly isSelectedDocumentTypeImagesOnly = computed(
    () => this.selectedDocumentType()?.id.toLowerCase() === IMPORT_DOCUMENT_TYPE_IDS.imagenes.toLowerCase()
  );
  readonly documentFileAccept = computed(() =>
    this.isSelectedDocumentTypeImagesOnly() ? IMAGE_DOCUMENT_FILE_ACCEPT : DEFAULT_DOCUMENT_FILE_ACCEPT
  );
  readonly documentFileHelperText = computed(() =>
    this.isSelectedDocumentTypeImagesOnly() ? IMAGE_DOCUMENT_FILE_HELPER_TEXT : DEFAULT_DOCUMENT_FILE_HELPER_TEXT
  );
  readonly documentSections = computed<DocumentSectionVm[]>(() => {
    const currentDocuments = this.documents();
    const currentRequiredDocumentTypes = this.requiredDocumentTypes();
    const approveConfirmDocumentTypeId = this.approveConfirmDocumentTypeId();
    const approvingDocumentTypeId = this.approvingDocumentTypeId();

    return this.getSortedRequiredDocumentTypes(currentRequiredDocumentTypes).map((required) => {
      const documents = currentDocuments
        .filter((document) => document.importDocumentTypeId === required.importDocumentTypeId)
        .map((document) => ({
          id: document.id,
          name: document.originalName,
          icon: this.getDocumentFileIcon(document.originalName),
          importDocumentTypeId: document.importDocumentTypeId,
          sizeLabel: this.getDocumentSizeLabel(document.filesize),
          uploadedAtLabel: this.getDocumentDateLabel(document.createdUtc)
        }));

      const documentsCount = documents.length;
      const isApproved = required.status === DOCUMENT_STATUS.aprobado;
      const canApprove = required.status === DOCUMENT_STATUS.enRevision && !this.isReadOnly();

      return {
        importDocumentTypeId: required.importDocumentTypeId,
        title: required.importDocumentTypeName,
        status: required.status,
        statusLabel: this.getDocumentStatusLabel(required.status),
        statusSeverity: this.getDocumentStatusSeverity(required.status),
        statusIcon: this.getDocumentStatusIcon(required.status),
        documentsCount,
        documentsCountLabel: this.getDocumentCountLabel(documentsCount),
        documents,
        isDisabled: documentsCount === 0,
        showRequiredText: required.isRequired && documentsCount === 0,
        showStatus: required.isRequired,
        isApproved,
        canApprove,
        isApproveConfirmOpen: approveConfirmDocumentTypeId === required.importDocumentTypeId,
        isApproving: approvingDocumentTypeId === required.importDocumentTypeId
      };
    });
  });
  readonly documentSectionActiveValue = computed(() => {
    const sections = this.documentSections();
    const firstEnabledSection = sections.find((section) => !section.isDisabled);
    return firstEnabledSection?.importDocumentTypeId ?? sections[0]?.importDocumentTypeId ?? null;
  });

  constructor() {
    effect(() => {
      const id = this.importId();
      this.resetDocumentForm();
      this.refreshDocuments(id, false);
    });

    effect(() => {
      const currentImport = this.importItem();
      this.requiredDocumentTypes.set(currentImport.importDocumentTypeRequireds);
    });
  }

  onDocumentTypeChange(documentTypeId: string | null): void {
    if (this.isReadOnly()) {
      return;
    }

    this.selectedDocumentTypeId.set(documentTypeId);
    this.selectedDocumentFile.set(null);
  }

  onDocumentFileSelected(file: File): void {
    if (this.isReadOnly()) {
      return;
    }

    this.selectedDocumentFile.set(file);
  }

  onDocumentFileCleared(): void {
    if (this.isReadOnly()) {
      return;
    }

    this.selectedDocumentFile.set(null);
  }

  onDocumentCancel(): void {
    if (this.isReadOnly()) {
      return;
    }

    this.resetDocumentForm();
  }

  onDocumentSave(): void {
    const id = this.importId();
    const importDocumentTypeId = this.selectedDocumentTypeId();
    const file = this.selectedDocumentFile();

    if (!importDocumentTypeId || !file || this.isSavingDocument() || this.isReadOnly()) {
      return;
    }

    this.isSavingDocument.set(true);
    this.uiBlockService.block();

    this.importsService
      .saveDocument(id, { importDocumentTypeId, file })
      .pipe(
        finalize(() => {
          this.isSavingDocument.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        this.resetDocumentForm();
        this.logsChanged.emit();

        if (response.data?.requiredDocumentStatus !== null && response.data?.requiredDocumentStatus !== undefined) {
          this.updateRequiredDocumentTypeStatus(importDocumentTypeId, response.data.requiredDocumentStatus);
        }

        if (response.data?.isStatusUpdated) {
          this.refreshImport(id);
          return;
        }

        this.refreshDocuments(id);
      });
  }

  onDocumentDownload(document: DocumentSectionItem): void {
    this.importsService.downloadDocument(document.id).subscribe({
      next: (file) => {
        const objectUrl = URL.createObjectURL(file);
        const link = globalThis.document.createElement('a');

        link.href = objectUrl;
        link.download = document.name;
        link.click();

        URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        this.appToastService.showServerError('No se pudo descargar el documento.');
      }
    });
  }

  onDocumentDelete(document: DocumentSectionItem): void {
    if (this.isReadOnly()) {
      return;
    }

    const id = this.importId();

    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar el archivo "${document.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteDocument(id, document)
    });
  }

  onApproveBadgeClick(importDocumentTypeId: string, canApprove: boolean, event: Event): void {
    event.stopPropagation();

    if (!canApprove || this.approvingDocumentTypeId() || this.isReadOnly()) {
      return;
    }

    this.approveConfirmDocumentTypeId.update((current) => (current === importDocumentTypeId ? null : importDocumentTypeId));
  }

  onApproveConfirmYes(importDocumentTypeId: string, event: Event): void {
    event.stopPropagation();

    const id = this.importId();

    if (this.approvingDocumentTypeId()) {
      return;
    }

    this.approvingDocumentTypeId.set(importDocumentTypeId);

    this.importsService
      .approveDocumentType(id, importDocumentTypeId)
      .pipe(
        finalize(() => {
          this.approvingDocumentTypeId.set(null);
          this.approveConfirmDocumentTypeId.set(null);
        })
      )
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        if (response.data?.isStatusUpdated) {
          this.refreshImport(id);
          return;
        }

        this.updateRequiredDocumentTypeStatus(importDocumentTypeId, DOCUMENT_STATUS.aprobado);
      });
  }

  onApproveConfirmNo(event: Event): void {
    event.stopPropagation();
    this.approveConfirmDocumentTypeId.set(null);
  }

  trackByDocumentSection(_: number, section: DocumentSectionVm): string {
    return section.importDocumentTypeId;
  }

  trackByDocumentItem(_: number, document: DocumentSectionItem): string {
    return document.id;
  }

  private deleteDocument(id: string, document: DocumentSectionItem): void {
    this.uiBlockService.block();

    this.importsService
      .deleteDocument(document.id)
      .pipe(finalize(() => this.uiBlockService.unblock()))
      .subscribe((response) => {
        this.appToastService.showApiMessages(response);

        if (!this.isSuccessfulResponse(response)) {
          return;
        }

        if (response.data?.requiredDocumentStatus !== null && response.data?.requiredDocumentStatus !== undefined) {
          this.updateRequiredDocumentTypeStatus(document.importDocumentTypeId, response.data.requiredDocumentStatus);
        }

        this.logsChanged.emit();
        this.refreshDocuments(id);
      });
  }

  private refreshImport(id: string): void {
    this.importsService.getById(id).subscribe((response) => {
      if (!response.data) {
        return;
      }

      this.importChanged.emit(response.data);
    });
  }

  private refreshDocuments(id: string, syncParent = true): void {
    this.importsService.getDocuments(id, ImportDocumentCategory.Gestion).subscribe((response) => {
      const documents = response.data ?? [];

      this.documents.set(documents);

      if (!syncParent) {
        return;
      }

      this.importChanged.emit({
        ...this.importItem(),
        importDocumentTypeRequireds: this.requiredDocumentTypes()
      });
    });
  }

  private resetDocumentForm(): void {
    this.selectedDocumentTypeId.set(null);
    this.selectedDocumentFile.set(null);
    this.approveConfirmDocumentTypeId.set(null);
  }

  private updateRequiredDocumentTypeStatus(importDocumentTypeId: string, status: number): void {
    this.requiredDocumentTypes.update((requiredDocumentTypes) =>
      requiredDocumentTypes.map((requiredDocumentType) =>
        requiredDocumentType.importDocumentTypeId === importDocumentTypeId ? { ...requiredDocumentType, status } : requiredDocumentType
      )
    );
  }

  private getDocumentStatusLabel(status: number): string {
    switch (status) {
      case DOCUMENT_STATUS.aprobado:
        return 'Aprobado';
      case DOCUMENT_STATUS.enRevision:
        return 'En revisión';
      case DOCUMENT_STATUS.faltante:
        return 'Faltante';
      default:
        return 'Sin estado';
    }
  }

  private getDocumentStatusSeverity(status: number): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case DOCUMENT_STATUS.aprobado:
        return 'success';
      case DOCUMENT_STATUS.enRevision:
        return 'warn';
      case DOCUMENT_STATUS.faltante:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  private getDocumentStatusIcon(status: number): string {
    switch (status) {
      case DOCUMENT_STATUS.aprobado:
        return 'pi pi-check';
      case DOCUMENT_STATUS.enRevision:
        return 'pi pi-clock';
      case DOCUMENT_STATUS.faltante:
        return 'pi pi-exclamation-circle';
      default:
        return 'pi pi-info-circle';
    }
  }

  private getDocumentCountLabel(count: number): string {
    return count === 1 ? '1 archivo' : `${count} archivos`;
  }

  private getDocumentFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.trim().toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'pi pi-file-pdf';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'pi pi-file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp':
      case 'svg':
        return 'pi pi-image';
      default:
        return 'pi pi-file';
    }
  }

  private getSortedRequiredDocumentTypes(requireds: ImportDetailDto['importDocumentTypeRequireds']): ImportDetailDto['importDocumentTypeRequireds'] {
    const sortBySortOrder = (left: { sortOrder: number }, right: { sortOrder: number }) => left.sortOrder - right.sortOrder;
    const requiredDocuments = requireds.filter((required) => required.isRequired).sort(sortBySortOrder);
    const optionalDocuments = requireds.filter((required) => !required.isRequired).sort(sortBySortOrder);

    return [...requiredDocuments, ...optionalDocuments];
  }

  private getDocumentSizeLabel(filesize: number): string {
    if (filesize < 1024) {
      return `${filesize} B`;
    }

    const sizeInKb = filesize / 1024;

    if (sizeInKb < 1024) {
      return `${Math.round(sizeInKb)} KB`;
    }

    return `${(sizeInKb / 1024).toFixed(1)} MB`;
  }

  private getDocumentDateLabel(createdUtc: string): string {
    const date = new Date(createdUtc);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  }

  private isSuccessfulResponse<T>(response: ApiResultOf<T> | ApiResult | null | undefined): response is ApiResult {
    return !!response?.isValid;
  }
}
