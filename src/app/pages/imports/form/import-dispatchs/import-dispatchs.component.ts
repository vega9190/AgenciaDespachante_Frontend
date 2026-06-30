import { Component, HostListener, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { DispatchCostItem, ImportDispatchFormModel } from '../../models/import-form.models';
import { isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import { ImportDetailDto } from '@services/imports/imports.types';
import { BorrowedNitsService } from '@services/borrowed-nits/borrowed-nits.service';
import { BorrowedNitListItemDto } from '@services/borrowed-nits/borrowed-nits.types';
import { TenantSettingsService } from '@services/tenant/tenant-settings.service';

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
  private readonly borrowedNitsService = inject(BorrowedNitsService);
  private readonly tenantSettingsService = inject(TenantSettingsService);

  readonly importItem = input<ImportDetailDto | null>(null);
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importItem()?.statusId));

  readonly maxCostAmount = MAX_COST_AMOUNT;

  readonly costs = signal<DispatchCostItem[]>([
    { description: MAIN_CHARGE_DESCRIPTION, amount: null },
    { description: 'Transp. Internacional', amount: null },
    { description: 'Almacenaje', amount: null },
    { description: 'Agencia', amount: null }
  ]);
  readonly totalCosts = computed(() =>
    this.costs().reduce((sum, c) => sum + (c.amount ?? 0), 0)
  );

  readonly borrowedNits = signal<BorrowedNitListItemDto[]>([]);
  readonly borrowedNitPopoverVisible = signal(false);
  readonly loadingBorrowedNits = signal(false);

  readonly dispatchForm: FormGroup<ImportDispatchFormModel> = this.formBuilder.group({
    mercaderia: this.formBuilder.nonNullable.control('', [Validators.maxLength(100)]),
    destino: this.formBuilder.nonNullable.control('', [Validators.maxLength(100)]),
    fecha: this.formBuilder.control<Date | null>(null),
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
    this.costs.update(list => [...list, { description: '', amount: null }]);
  }

  removeCost(index: number): void {
    this.costs.update(list => list.filter((_, i) => i !== index));
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

  getDispatchItems() {
    return this.costs().map((item, i) => ({
      description: item.description,
      amount: item.amount ?? 0,
      isTractor: false,
      isMainCharge: i === 0,
      dim: null,
      taxAmount: null,
      storageAmount: null
    }));
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
