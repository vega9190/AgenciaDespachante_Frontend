import { Component, HostListener, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

import { DispatchCostItem, ImportDispatchFormModel, TractorItem } from '../../models/import-form.models';
import { isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import { ImportDetailDto, SaveDispatchFormRequest } from '@services/imports/imports.types';
import { ImportsService } from '@services/imports/imports.service';
import { BorrowedNitsService } from '@services/borrowed-nits/borrowed-nits.service';
import { BorrowedNitListItemDto } from '@services/borrowed-nits/borrowed-nits.types';
import { TenantSettingsService } from '@services/tenant/tenant-settings.service';
import { UiBlockService } from '@services/common/ui-block.service';
import { ReportsService } from '@services/reports/reports.service';

const MAX_COST_AMOUNT = 99999.99;
const MAIN_CHARGE_DESCRIPTION = 'Gestión Operativa';

@Component({
  selector: 'app-import-dispatchs',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DatePickerModule,
    InputGroup,
    InputGroupAddonModule,
    InputNumberModule,
    InputTextModule,
    TooltipModule,
    CurrencyPipe
  ],
  templateUrl: './import-dispatchs.component.html',
  styleUrl: './import-dispatchs.component.css'
})
export class ImportDispatchsComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly importsService = inject(ImportsService);
  private readonly uiBlockService = inject(UiBlockService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly borrowedNitsService = inject(BorrowedNitsService);
  private readonly tenantSettingsService = inject(TenantSettingsService);
  private readonly reportsService = inject(ReportsService);

  readonly importItem = input<ImportDetailDto | null>(null);
  readonly logsChanged = output<void>();
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importItem()?.statusId));

  constructor() {
    effect(() => {
      const item = this.importItem();
      if (!item?.id) return;
      this.loadDispatchForm(item.id);
    });
  }

  readonly maxCostAmount = MAX_COST_AMOUNT;

  readonly costs = signal<DispatchCostItem[]>([
    { id: null, description: MAIN_CHARGE_DESCRIPTION, amount: null },
    { id: null, description: 'Transp. Internacional', amount: null },
    { id: null, description: 'Almacenaje', amount: null },
    { id: null, description: 'Agencia', amount: null }
  ]);
  readonly totalCosts = computed(() =>
    this.costs().reduce((sum, c) => sum + (c.amount ?? 0), 0)
  );

  readonly tractors = signal<TractorItem[]>([]);
  readonly totalTractors = computed(() =>
    this.tractors().reduce((sum, t) => sum + (t.taxAmount ?? 0) + (t.storageAmount ?? 0), 0)
  );
  readonly totalAll = computed(() => this.totalCosts() + this.totalTractors());

  readonly isSaving = signal(false);
  readonly isLoadingDispatch = signal(false);
  readonly showItemErrors = signal(false);

  readonly borrowedNits = signal<BorrowedNitListItemDto[]>([]);
  readonly borrowedNitPopoverVisible = signal(false);
  readonly loadingBorrowedNits = signal(false);

  readonly dispatchForm: FormGroup<ImportDispatchFormModel> = this.formBuilder.group({
    mercaderia: this.formBuilder.nonNullable.control('', [Validators.maxLength(100)]),
    destino: this.formBuilder.nonNullable.control('', [Validators.maxLength(100)]),
    fecha: this.formBuilder.control<Date | null>(new Date()),
    dim: this.formBuilder.nonNullable.control('', [Validators.maxLength(50)]),
    agencia: this.formBuilder.nonNullable.control('', [Validators.maxLength(50)]),
    nit: this.formBuilder.nonNullable.control('', [Validators.maxLength(50)])
  });

  ngOnInit(): void {
    this.tenantSettingsService.getSettings().subscribe({
      next: (result) => {
        const defaultAmount = result.data?.defaultImportCharge ?? null;
        this.costs.update(list =>
          list.map((item, i) => i === 0 ? { ...item, amount: defaultAmount } : item)
        );
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.borrowedNitPopoverVisible.set(false);
  }

  toggleBorrowedNits(event: MouseEvent): void {
    event.stopPropagation();

    if (this.borrowedNitPopoverVisible()) {
      this.borrowedNitPopoverVisible.set(false);
      return;
    }

    this.loadingBorrowedNits.set(true);
    this.borrowedNitPopoverVisible.set(true);

    this.borrowedNitsService.getList({ isActive: true, pageSize: 100 }).subscribe({
      next: (result) => {
        this.borrowedNits.set(result.data?.items ?? []);
        this.loadingBorrowedNits.set(false);
      },
      error: () => {
        this.loadingBorrowedNits.set(false);
      }
    });
  }

  selectBorrowedNit(item: BorrowedNitListItemDto): void {
    this.dispatchForm.controls.nit.setValue(item.nit);
    this.borrowedNitPopoverVisible.set(false);
  }

  addCost(): void {
    this.costs.update(list => [...list, { id: null, description: '', amount: null }]);
  }

  removeCost(index: number): void {
    const item = this.costs()[index];
    if (!item) return;

    if (!item.id) {
      this.costs.update(list => list.filter((_, i) => i !== index));
      return;
    }

    this.confirmDeleteDispatchItem(item.id, item.description);
  }

  updateCostDescription(index: number, value: string): void {
    this.costs.update(list =>
      list.map((item, i) => i === index ? { ...item, description: value } : item)
    );
  }

  updateCostAmount(index: number, value: number | null): void {
    this.costs.update(list =>
      list.map((item, i) => i === index ? { ...item, amount: value } : item)
    );
  }

  addTractor(): void {
    this.tractors.update(list => [...list, { id: null, description: '', dim: null, taxAmount: null, storageAmount: null }]);
  }

  removeTractor(index: number): void {
    const item = this.tractors()[index];
    if (!item) return;

    if (!item.id) {
      this.tractors.update(list => list.filter((_, i) => i !== index));
      return;
    }

    this.confirmDeleteDispatchItem(item.id, item.description);
  }

  updateTractorField(index: number, field: keyof TractorItem, value: string | number | null): void {
    this.tractors.update(list =>
      list.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  }

  getDispatchItems() {
    const costs = this.costs().map((item, i) => ({
      id: item.id,
      description: item.description,
      amount: item.amount ?? 0,
      isTractor: false,
      isMainCharge: i === 0,
      dim: null,
      taxAmount: null,
      storageAmount: null
    }));

    const tractors = this.tractors().map(t => ({
      id: t.id,
      description: t.description,
      amount: (t.taxAmount ?? 0) + (t.storageAmount ?? 0),
      isTractor: true,
      isMainCharge: false,
      dim: t.dim,
      taxAmount: t.taxAmount,
      storageAmount: t.storageAmount
    }));

    return [...costs, ...tractors];
  }

  saveDispatchForm(): void {
    const importId = this.importItem()?.id;
    if (!importId) return;

    if (!this.dispatchForm.controls.fecha.value) {
      this.dispatchForm.controls.fecha.setValue(new Date());
    }

    const validationError = this.validateDispatchItems();
    if (validationError) {
      this.showItemErrors.set(true);
      this.messageService.add({ severity: 'warn', summary: 'Validación', detail: validationError });
      return;
    }

    this.showItemErrors.set(false);

    const { nit, fecha, dim, agencia, destino, mercaderia } = this.dispatchForm.getRawValue();

    const request: SaveDispatchFormRequest = {
      nit: nit || null,
      date: fecha ? this.toLocalDateString(fecha) : null,
      dim: dim || null,
      agency: agencia || null,
      destination: destino || null,
      commodity: mercaderia || null,
      items: this.getDispatchItems()
    };

    this.isSaving.set(true);
    this.uiBlockService.block();

    this.importsService.saveDispatchForm(importId, request)
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.uiBlockService.unblock();
        })
      )
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Despacho guardado correctamente.' });
          this.loadDispatchForm(importId);
          this.logsChanged.emit();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el despacho.' });
        }
      });
  }

  private confirmDeleteDispatchItem(dispatchItemId: string, description: string): void {
    const name = this.escapeHtml(description.trim()) || 'este item';

    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Está seguro de eliminar <b>${name}</b> del despacho?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteDispatchItem(dispatchItemId)
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private deleteDispatchItem(dispatchItemId: string): void {
    const importId = this.importItem()?.id;
    if (!importId) return;

    this.uiBlockService.block();

    this.importsService.deleteDispatchItem(dispatchItemId)
      .pipe(finalize(() => this.uiBlockService.unblock()))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Item de despacho eliminado correctamente.' });
          this.loadDispatchForm(importId);
          this.logsChanged.emit();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el item de despacho.' });
        }
      });
  }

  downloadReport(): void {
    const importId = this.importItem()?.id;
    if (!importId) return;

    this.uiBlockService.block();
    this.reportsService.downloadDispatchForm(importId)
      .pipe(finalize(() => this.uiBlockService.unblock()))
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) return;

          const fileName = this.getReportFileName(response.headers.get('content-disposition'));
          const objectUrl = URL.createObjectURL(blob);
          const link = globalThis.document.createElement('a');

          link.href = objectUrl;
          link.download = fileName;
          link.click();

          URL.revokeObjectURL(objectUrl);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el reporte.' });
        }
      });
  }

  private getReportFileName(contentDisposition: string | null): string {
    const encoded = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    if (encoded) return decodeURIComponent(encoded);

    const plain = contentDisposition?.match(/filename="?([^";]+)"?/i)?.[1]?.trim();
    return plain ?? 'formulario-despacho.pdf';
  }

  private parseDateLocal(dateStr: string | Date): Date {
    const s = typeof dateStr === 'string' ? dateStr : dateStr.toISOString();
    const [year, month, day] = s.substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private toLocalDateString(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  private validateDispatchItems(): string | null {
    for (const [i, c] of this.costs().entries()) {
      if (!c.description.trim() || c.amount === null) {
        return `El concepto #${i + 1} del despacho requiere Concepto y Monto.`;
      }
    }
    for (const [i, t] of this.tractors().entries()) {
      if (!t.description.trim() || !t.dim?.trim() || t.taxAmount === null || t.storageAmount === null) {
        return `El tractor #${i + 1} requiere Tractor/referencia, DIM, Impuestos y Almacenaje.`;
      }
    }
    return null;
  }

  private loadDispatchForm(importId: string): void {
    this.isLoadingDispatch.set(true);
    this.importsService.getDispatchForm(importId).pipe(
      finalize(() => this.isLoadingDispatch.set(false))
    ).subscribe({
      next: (result) => {
        const dto = result.data;
        if (!dto) {
          const fallbackNit = this.importItem()?.clientTaxId ?? '';
          this.dispatchForm.controls.nit.setValue(fallbackNit, { emitEvent: false });
          return;
        }

        this.dispatchForm.patchValue({
          nit: dto.dispatchNit ?? '',
          fecha: dto.date ? this.parseDateLocal(dto.date) : new Date(),
          dim: dto.dim ?? '',
          agencia: dto.agency ?? '',
          destino: dto.destination ?? '',
          mercaderia: dto.commodity ?? ''
        }, { emitEvent: false });

        const costItems = dto.items
          .filter(i => !i.isTractor)
          .map(i => ({ id: i.id, description: i.description, amount: i.amount }));
        if (costItems.length) this.costs.set(costItems);

        const tractorItems = dto.items
          .filter(i => i.isTractor)
          .map(i => ({ id: i.id, description: i.description, dim: i.dim ?? null, taxAmount: i.taxAmount ?? null, storageAmount: i.storageAmount ?? null }));
        this.tractors.set(tractorItems);
      }
    });
  }

  getDispatchFieldError(controlName: keyof ImportDispatchFormModel): string {
    const control = this.dispatchForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('maxlength')) {
      return 'El valor ingresado supera el largo permitido.';
    }

    return '';
  }
}
