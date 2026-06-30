import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { ImportDispatchFormModel } from '../../models/import-form.models';
import { isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import { ImportDetailDto } from '@services/imports/imports.types';
import { BorrowedNitsService } from '@services/borrowed-nits/borrowed-nits.service';
import { BorrowedNitListItemDto } from '@services/borrowed-nits/borrowed-nits.types';

@Component({
  selector: 'app-import-dispatchs',
  imports: [ReactiveFormsModule, ButtonModule, DatePickerModule, InputTextModule, TooltipModule],
  templateUrl: './import-dispatchs.component.html',
  styleUrl: './import-dispatchs.component.css'
})
export class ImportDispatchsComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly borrowedNitsService = inject(BorrowedNitsService);

  readonly importItem = input<ImportDetailDto | null>(null);
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importItem()?.statusId));

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
