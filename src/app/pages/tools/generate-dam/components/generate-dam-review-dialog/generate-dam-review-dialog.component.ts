import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { GenerateDamReviewData, GenerateDamReviewItem } from '@models/generate-dam/generate-dam-review.models';
import {
  GenerateDamArancelOption,
  GenerateDamCountryOption,
  GenerateDamOption,
  GenerateDamSeaportOption
} from '@models/generate-dam/generate-dam-option.models';

@Component({
  selector: 'app-generate-dam-review-dialog',
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TooltipModule],
  templateUrl: './generate-dam-review-dialog.component.html',
  styleUrl: './generate-dam-review-dialog.component.css'
})
export class GenerateDamReviewDialogComponent {
  private readonly arancelPageSize = 100;

  readonly visible = input(false);
  readonly reviewData = input<GenerateDamReviewData | null>(null);
  readonly countries = input<GenerateDamCountryOption[]>([]);
  readonly seaports = input<GenerateDamSeaportOption[]>([]);
  readonly arancelOptions = input<GenerateDamArancelOption[]>([]);
  readonly usoOptions = input<GenerateDamOption[]>([]);
  readonly estadoMercaderiaOptions = input<GenerateDamOption[]>([]);
  readonly aduanaIngresoOptions = input<GenerateDamOption[]>([]);

  readonly cancelled = output<void>();
  readonly confirmed = output<GenerateDamReviewData>();

  readonly currentStep = signal(1);
  readonly arancelQuery = signal('');
  readonly openArancelPopoverIndex = signal<number | null>(null);

  readonly filteredArancelOptions = computed(() => {
    const term = this.arancelQuery().trim().toLowerCase();
    const arancelOptions = this.arancelOptions();

    if (!term) {
      const baseOptions = arancelOptions.slice(0, this.arancelPageSize);
      const selectedAndSuggestedOptions = (this.reviewData()?.items ?? []).flatMap((item) => [
        item.selectedArancelOption,
        ...item.arancelSuggestions
      ]);

      return [...selectedAndSuggestedOptions, ...baseOptions].filter(
        (option, index, allOptions): option is GenerateDamArancelOption =>
          !!option && allOptions.findIndex((candidate) => candidate?.cleanCode === option.cleanCode) === index
      );
    }

    return arancelOptions
      .filter((option) => option.cleanCode.includes(term) || option.description.toLowerCase().includes(term))
      .slice(0, this.arancelPageSize);
  });

  onHide(): void {
    this.openArancelPopoverIndex.set(null);
    this.cancelled.emit();
  }

  onCancel(): void {
    this.openArancelPopoverIndex.set(null);
    this.cancelled.emit();
  }

  onConfirm(): void {
    const reviewData = this.reviewData();

    if (!reviewData || !this.isReviewValid()) {
      return;
    }

    this.confirmed.emit(structuredClone(reviewData));
  }

  onArancelSearch(value: string): void {
    this.arancelQuery.set(value);
  }

  onArancelChange(item: GenerateDamReviewItem, cleanCode: string | null | undefined): void {
    if (!cleanCode) {
      item.subPartidaArancelariaCodigo = '';
      item.subPartidaArancelariaDescripcion = '';
      item.selectedArancelOption = null;
      this.openArancelPopoverIndex.set(null);
      return;
    }

    const arancelOption = this.arancelOptions().find((option) => option.cleanCode === cleanCode)
      ?? item.arancelSuggestions.find((option) => option.cleanCode === cleanCode)
      ?? null;

    item.subPartidaArancelariaCodigo = cleanCode;
    item.subPartidaArancelariaDescripcion = arancelOption?.description ?? '';
    item.selectedArancelOption = arancelOption;
    this.openArancelPopoverIndex.set(null);
  }

  onUsoChange(item: GenerateDamReviewItem, usoCodigo: string | null | undefined): void {
    if (!usoCodigo) {
      item.usoCodigo = '';
      item.usoDescripcion = '';
      item.usoEspecifique = null;
      return;
    }

    const usoOption = this.usoOptions().find((option) => option.codigo === usoCodigo);
    item.usoCodigo = usoCodigo;
    item.usoDescripcion = usoOption?.descripcion ?? '';

    if (usoCodigo !== '99') {
      item.usoEspecifique = null;
    }
  }

  onEstadoChange(item: GenerateDamReviewItem, estadoCodigo: string | null | undefined): void {
    if (!estadoCodigo) {
      item.estadoCodigo = '';
      item.estadoDescripcion = '';
      return;
    }

    const estadoOption = this.estadoMercaderiaOptions().find((option) => option.codigo === estadoCodigo);
    item.estadoCodigo = estadoCodigo;
    item.estadoDescripcion = estadoOption?.descripcion ?? '';
  }

  nextStep(): void {
    if (this.currentStep() === 1 && this.isStep1Valid()) {
      this.currentStep.set(2);
      return;
    }

    if (this.currentStep() === 2 && this.isStep2Valid()) {
      this.currentStep.set(3);
    }
  }

  prevStep(): void {
    this.currentStep.update((step) => Math.max(1, step - 1));
  }

  isStep1Valid(): boolean {
    const reviewData = this.reviewData();

    if (!reviewData) {
      return false;
    }

    const provider = reviewData.proveedor;
    return !!(
      provider.nitImportadorConsignatario.trim() &&
      provider.razonSocial.trim() &&
      provider.calleAvenida.trim() &&
      provider.numero.trim() &&
      provider.pais.codigo.trim() &&
      provider.ciudad.codigo.trim()
    );
  }

  isStep2Valid(): boolean {
    const reviewData = this.reviewData();

    if (!reviewData) {
      return false;
    }

    return !!(
      reviewData.paisAdquisicion.codigo.trim() &&
      reviewData.paisProcedencia.codigo.trim() &&
      reviewData.paisExportacion.codigo.trim() &&
      reviewData.paisTransito.codigo.trim() &&
      reviewData.aduanaIngreso.codigo.trim()
    );
  }

  isReviewValid(): boolean {
    const reviewData = this.reviewData();

    if (!reviewData || !this.isStep1Valid() || !this.isStep2Valid()) {
      return false;
    }

    return reviewData.items.every(
      (item) =>
        item.subPartidaArancelariaCodigo.trim() &&
        item.subPartidaArancelariaDescripcion.trim() &&
        item.especifiqueNombreTxt.trim() &&
        item.descripcionComercialMercancia.trim() &&
        item.usoCodigo.trim() &&
        (item.usoCodigo !== '99' || !!item.usoEspecifique?.trim())
    );
  }

  trackItem(index: number): number {
    return index;
  }

  toggleArancelPopover(index: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openArancelPopoverIndex.update((currentIndex) => (currentIndex === index ? null : index));
  }

  closeArancelPopover(): void {
    this.openArancelPopoverIndex.set(null);
  }

  isArancelPopoverOpen(index: number): boolean {
    return this.openArancelPopoverIndex() === index;
  }

  applySuggestedArancel(item: GenerateDamReviewItem, suggestion: GenerateDamArancelOption, event: MouseEvent): void {
    event.stopPropagation();
    this.onArancelChange(item, suggestion.cleanCode);
  }
}
