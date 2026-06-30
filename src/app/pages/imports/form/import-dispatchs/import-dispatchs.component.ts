import { Component, computed, inject, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';

import { ImportDispatchFormModel } from '../../models/import-form.models';
import { isReadOnlyImportStatus } from '@services/imports/import-status.constants';
import { ImportDetailDto } from '@services/imports/imports.types';

@Component({
  selector: 'app-import-dispatchs',
  imports: [ReactiveFormsModule, ButtonModule, DatePickerModule, InputTextModule],
  templateUrl: './import-dispatchs.component.html',
  styleUrl: './import-dispatchs.component.css'
})
export class ImportDispatchsComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly importItem = input<ImportDetailDto | null>(null);
  readonly isReadOnly = computed(() => isReadOnlyImportStatus(this.importItem()?.statusId));

  readonly dispatchForm: FormGroup<ImportDispatchFormModel> = this.formBuilder.group({
    mercaderia: this.formBuilder.nonNullable.control('', [Validators.maxLength(100)]),
    destino: this.formBuilder.nonNullable.control('', [Validators.maxLength(100)]),
    fecha: this.formBuilder.control<Date | null>(null),
    dim: this.formBuilder.nonNullable.control('', [Validators.maxLength(50)]),
    agencia: this.formBuilder.nonNullable.control('', [Validators.maxLength(50)])
  });

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
