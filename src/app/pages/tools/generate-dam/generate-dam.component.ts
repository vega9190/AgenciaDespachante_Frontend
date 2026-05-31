import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import arancelesData from './files/aranceles.json';
import countriesData from './files/countries.json';
import seaportsData from './files/seaports.json';

import { FileSelectorComponent } from '../../../common-components/file-selector/file-selector.component';
import { GenerateDamReviewDialogComponent } from './components/generate-dam-review-dialog/generate-dam-review-dialog.component';
import { GenerateDamFormModel, GenerateDamFormValue } from '@models/generate-dam/generate-dam-form.models';
import { DamOutputDto } from '@models/generate-dam/generate-dam-output.models';
import {
  GenerateDamArancelOption,
  GenerateDamCountryOption,
  GenerateDamFileDescriptor,
  GenerateDamOption,
  GenerateDamSeaportOption
} from '@models/generate-dam/generate-dam-option.models';
import { GenerateDamReviewData } from '@models/generate-dam/generate-dam-review.models';
import { AiService } from '@services/ai/ai.service';
import { AiPythonArancelBatchResultItemDto, BolDto, InvoiceDto } from '@services/ai/ai.types';
import { AppToastService } from '@services/common/app-toast.service';

import { GENERATE_DAM_OPTIONS } from './files/generate-dam-options';
import { GenerateDamOutputBuilder } from './generate-dam-output.builder';
import { downloadJsonFile, getCountryCode, getSeaportCode, normalizeArancelCode } from './generate-dam.utils';

@Component({
  selector: 'app-generate-dam',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputTextModule,
    SelectModule,
    FileSelectorComponent,
    GenerateDamReviewDialogComponent
  ],
  templateUrl: './generate-dam.component.html',
  styleUrl: './generate-dam.component.css'
})
export class GenerateDamComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly aiService = inject(AiService);
  private readonly appToastService = inject(AppToastService);

  readonly isSubmitting = signal(false);
  readonly showReviewDialog = signal(false);
  readonly facturaFile = signal<GenerateDamFileDescriptor | null>(null);
  readonly bolFile = signal<GenerateDamFileDescriptor | null>(null);
  readonly usoEspecifique = signal('');
  readonly reviewData = signal<GenerateDamReviewData | null>(null);
  readonly elapsedSeconds = signal(0);

  private currentDamOutput: DamOutputDto | null = null;
  private currentFormSnapshot: (GenerateDamFormValue & { usoEspecifique: string | null }) | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  readonly pageTitle = 'Generar DAM';
  readonly fileAccept = '.pdf,.jpg,.jpeg,.png,.gif,.webp';
  readonly fileHelperText = 'Formatos permitidos: PDF, JPG, JPEG, PNG, GIF y WEBP. Tamaño maximo: 5 MB.';

  readonly condicionVendedorOptions = GENERATE_DAM_OPTIONS.condicionVendedor;
  readonly condicionEntregaOptions = GENERATE_DAM_OPTIONS.condicionEntrega;
  readonly naturalezaTransaccionOptions = GENERATE_DAM_OPTIONS.naturalezaTransaccion;
  readonly destinoMercaderiaOptions = GENERATE_DAM_OPTIONS.destinoMercaderia;
  readonly formaPagoOptions = GENERATE_DAM_OPTIONS.formaPago;
  readonly medioPagoOptions = GENERATE_DAM_OPTIONS.medioPago;
  readonly unidadComercialOptions = GENERATE_DAM_OPTIONS.unidadComercial;
  readonly embalajeOptions = GENERATE_DAM_OPTIONS.embalaje;
  readonly estadoMercaderiaOptions = GENERATE_DAM_OPTIONS.estadoMercaderia;
  readonly usoOptions = GENERATE_DAM_OPTIONS.uso;
  readonly destinoRegimenAduaneroOptions = GENERATE_DAM_OPTIONS.destinoRegimenAduanero;
  readonly modalidadRegimenOptionsBase = GENERATE_DAM_OPTIONS.modalidadRegimen;
  readonly modalidadDespachoOptionsBase = GENERATE_DAM_OPTIONS.modalidadDespacho;
  readonly destinoRegimenPosteriorOptionsBase = GENERATE_DAM_OPTIONS.destinoRegimenPosteriorDeposito;
  readonly modalidadDespachoPosteriorOptionsBase = GENERATE_DAM_OPTIONS.modalidadDespachoPosteriorDeposito;
  readonly emisionParteRecepcionOptions = GENERATE_DAM_OPTIONS.emisionParteRecepcion;
  readonly tipoMercaderiaOptions = GENERATE_DAM_OPTIONS.tipoMercaderia;
  readonly formaEnvioOptions = GENERATE_DAM_OPTIONS.formaEnvio;
  readonly transporteModoOptions = GENERATE_DAM_OPTIONS.transporteModo;
  readonly aduanaIngresoOptions = GENERATE_DAM_OPTIONS.aduanaIngreso;

  readonly countries = (countriesData as Array<{ code: string; country: string }>).map((country) => ({
    codigo: country.code,
    descripcion: country.country
  })) satisfies GenerateDamCountryOption[];

  readonly seaports = (seaportsData as Array<{ code: string; country: string; city: string; state: string | null }>).map((seaport) => ({
    codigo: seaport.code,
    descripcion: seaport.city,
    label: `${seaport.code} - ${seaport.city}${seaport.state ? `, ${seaport.state}` : ''}`
  })) satisfies GenerateDamSeaportOption[];

  readonly arancelOptions = (arancelesData as Array<{ cleanCode: string; description: string }>).map((item) => ({
    cleanCode: item.cleanCode,
    description: item.description
  })) satisfies GenerateDamArancelOption[];

  readonly modalidadRegimenOptions = signal<GenerateDamOption[]>([]);
  readonly modalidadDespachoOptions = signal<GenerateDamOption[]>(this.modalidadDespachoOptionsBase);
  readonly destinoRegimenPosteriorOptions = signal<GenerateDamOption[]>(this.destinoRegimenPosteriorOptionsBase);
  readonly modalidadDespachoPosteriorOptions = signal<GenerateDamOption[]>(this.modalidadDespachoPosteriorOptionsBase);

  readonly generateDamForm = this.formBuilder.group<GenerateDamFormModel>({
    factura: this.formBuilder.nonNullable.control('', [Validators.required]),
    bol: this.formBuilder.nonNullable.control('', [Validators.required]),
    numeroReferencia: this.formBuilder.nonNullable.control('', [Validators.required]),
    formaEnvio: this.formBuilder.control<string | null>(null, [Validators.required]),
    cargaConsolidada: this.formBuilder.nonNullable.control(false),
    destinoRegimenAduanero: this.formBuilder.control<string | null>(null, [Validators.required]),
    modalidadRegimen: this.formBuilder.control<string | null>({ value: null, disabled: true }, [Validators.required]),
    modalidadDespacho: this.formBuilder.control<string | null>(null, [Validators.required]),
    destinoRegimenPosterior: this.formBuilder.control<string | null>({ value: null, disabled: true }),
    modalidadDespachoPosterior: this.formBuilder.control<string | null>({ value: null, disabled: true }),
    desdeFrontera: this.formBuilder.control<string | null>(null, [Validators.required]),
    hastaFrontera: this.formBuilder.control<string | null>(null, [Validators.required]),
    emisionParteRecepcion: this.formBuilder.control<string | null>({ value: null, disabled: true }),
    tipoMercaderia: this.formBuilder.control<string | null>({ value: null, disabled: true }),
    vieneZonaFranca: this.formBuilder.nonNullable.control(false),
    correoElectronico: this.formBuilder.nonNullable.control('', [Validators.required, Validators.email]),
    condicionVendedor: this.formBuilder.control<string | null>(null, [Validators.required]),
    condicionEntrega: this.formBuilder.control<string | null>(null, [Validators.required]),
    destinoMercaderia: this.formBuilder.control<string | null>(null, [Validators.required]),
    formaPago: this.formBuilder.control<string | null>(null, [Validators.required]),
    medioPago: this.formBuilder.control<string | null>(null, [Validators.required]),
    unidadComercial: this.formBuilder.control<string | null>(null, [Validators.required]),
    embalaje: this.formBuilder.control<string | null>(null, [Validators.required]),
    estadoMercaderia: this.formBuilder.control<string | null>(null, [Validators.required]),
    uso: this.formBuilder.control<string | null>(null, [Validators.required])
  });

  constructor() {
    this.generateDamForm.controls.uso.valueChanges.subscribe((uso) => {
      if (uso !== '99') {
        this.usoEspecifique.set('');
      }
    });

    this.generateDamForm.controls.destinoRegimenAduanero.valueChanges.subscribe((codigo) => {
      this.updateModalidadRegimenOptions(codigo);
      this.syncDepositoControls(codigo);
      this.refreshDynamicSelectOptions();
      this.syncEmisionParteRecepcionState();
    });

    this.generateDamForm.controls.modalidadRegimen.valueChanges.subscribe(() => {
      this.refreshDynamicSelectOptions();
    });

    this.generateDamForm.controls.destinoRegimenPosterior.valueChanges.subscribe(() => {
      this.refreshDynamicSelectOptions();
    });

    this.generateDamForm.controls.emisionParteRecepcion.valueChanges.subscribe(() => {
      this.syncTipoMercaderiaState();
    });
  }

  onFacturaSelected(file: File): void {
    this.facturaFile.set({ file });
    this.generateDamForm.controls.factura.setValue(file.name);
    this.generateDamForm.controls.factura.markAsTouched();
  }

  onFacturaCleared(): void {
    this.facturaFile.set(null);
    this.generateDamForm.controls.factura.reset('');
  }

  onBolSelected(file: File): void {
    this.bolFile.set({ file });
    this.generateDamForm.controls.bol.setValue(file.name);
    this.generateDamForm.controls.bol.markAsTouched();
  }

  onBolCleared(): void {
    this.bolFile.set(null);
    this.generateDamForm.controls.bol.reset('');
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      this.generateDamForm.markAllAsTouched();
      return;
    }

    const facturaFile = this.facturaFile()?.file;
    const bolFile = this.bolFile()?.file;

    if (!facturaFile || !bolFile) {
      return;
    }

    this.isSubmitting.set(true);
    this.startTimer();

    forkJoin({
      invoice: this.aiService.processInvoice({ file: facturaFile }),
      bol: this.aiService.processBol({ file: bolFile })
    })
      .subscribe({
        next: ({ invoice, bol }) => {
          if (!invoice?.isValid || !invoice.data || !bol?.isValid || !bol.data) {
            this.stopProcessing();
            this.appToastService.showApiMessages(invoice);
            this.appToastService.showApiMessages(bol);
            return;
          }

          this.processBatchSuggestions(invoice.data.invoice, bol.data.bol);
        },
        error: () => {
          this.stopProcessing();
          this.appToastService.showServerError('No pudimos procesar los documentos en este momento.');
        }
      });
  }

  closeReviewDialog(): void {
    this.showReviewDialog.set(false);
    this.stopTimer();
  }

  confirmReview(reviewData: GenerateDamReviewData): void {
    if (!this.currentDamOutput || !this.currentFormSnapshot) {
      return;
    }

    this.applyReviewDataToOutput(this.currentDamOutput, reviewData);
    downloadJsonFile(`DAM-${this.currentFormSnapshot.numeroReferencia}.json`, this.currentDamOutput);

    this.showReviewDialog.set(false);
    this.stopTimer();
    this.reviewData.set(null);
    this.currentDamOutput = null;
    this.currentFormSnapshot = null;
    this.facturaFile.set(null);
    this.bolFile.set(null);
    this.usoEspecifique.set('');
    this.generateDamForm.reset({
      factura: '',
      bol: '',
      numeroReferencia: '',
      formaEnvio: null,
      cargaConsolidada: false,
      destinoRegimenAduanero: null,
      modalidadRegimen: null,
      modalidadDespacho: null,
      destinoRegimenPosterior: null,
      modalidadDespachoPosterior: null,
      desdeFrontera: null,
      hastaFrontera: null,
      emisionParteRecepcion: null,
      tipoMercaderia: null,
      vieneZonaFranca: false,
      correoElectronico: '',
      condicionVendedor: null,
      condicionEntrega: null,
      destinoMercaderia: null,
      formaPago: null,
      medioPago: null,
      unidadComercial: null,
      embalaje: null,
      estadoMercaderia: null,
      uso: null
    });
    this.updateModalidadRegimenOptions(null);
    this.refreshDynamicSelectOptions();
    this.syncEmisionParteRecepcionState();
  }

  getFieldError(controlName: keyof GenerateDamFormModel): string {
    const control = this.generateDamForm.controls[controlName];

    if (!control.touched && !control.dirty) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('email')) {
      return 'El correo electrónico no es válido.';
    }

    return '';
  }

  canSubmit(): boolean {
    const requiresUsoEspecifique = this.generateDamForm.controls.uso.value === '99';

    return !this.isSubmitting()
      && this.generateDamForm.valid
      && !!this.facturaFile()
      && !!this.bolFile()
      && (!requiresUsoEspecifique || !!this.usoEspecifique().trim());
  }

  private processBatchSuggestions(invoice: InvoiceDto, bol: BolDto): void {
    const batchItems = (invoice.items ?? [])
      .map((item, index) => {
        const description = (item.name ?? item.comercialDescription ?? '').trim();
        return description ? { id: String(index), description } : null;
      })
      .filter((item): item is { id: string; description: string } => item !== null);

    if (batchItems.length === 0) {
      this.openReview(invoice, bol, []);
      return;
    }

    this.aiService
      .classifyArancelBatch({ items: batchItems })
      .subscribe({
        next: (response) => {
          if (!response?.isValid) {
            this.appToastService.showApiMessages(response);
            this.openReview(invoice, bol, []);
            return;
          }

          this.openReview(invoice, bol, response.data?.results ?? []);
        },
        error: () => {
          this.openReview(invoice, bol, []);
        }
      });
  }

  private openReview(invoice: InvoiceDto, bol: BolDto, batchResults: AiPythonArancelBatchResultItemDto[]): void {
    const formSnapshot = {
      ...this.generateDamForm.getRawValue(),
      usoEspecifique: this.usoEspecifique().trim() || null
    } satisfies GenerateDamFormValue & { usoEspecifique: string | null };

    const builder = new GenerateDamOutputBuilder(invoice, bol, {
      condicionVendedor: this.condicionVendedorOptions,
      condicionEntrega: this.condicionEntregaOptions,
      naturalezaTransaccion: this.naturalezaTransaccionOptions,
      destinoMercaderia: this.destinoMercaderiaOptions,
      formaPago: this.formaPagoOptions,
      medioPago: this.medioPagoOptions,
      unidadComercial: this.unidadComercialOptions,
      embalaje: this.embalajeOptions,
      estadoMercaderia: this.estadoMercaderiaOptions,
      uso: this.usoOptions,
      destinoRegimenAduanero: this.destinoRegimenAduaneroOptions,
      modalidadRegimen: this.modalidadRegimenOptions(),
      modalidadDespacho: this.modalidadDespachoOptions(),
      destinoRegimenPosterior: this.destinoRegimenPosteriorOptions(),
      modalidadDespachoPosterior: this.modalidadDespachoPosteriorOptions(),
      emisionParteRecepcion: this.emisionParteRecepcionOptions,
      tipoMercaderia: this.tipoMercaderiaOptions,
      formaEnvio: this.formaEnvioOptions,
      transporteModo: this.transporteModoOptions
    });

    const damOutput = builder.build(formSnapshot);
    const suggestionMap = this.mapBatchSuggestions(batchResults);

    damOutput.datosMercancias.forEach((item, index) => {
      const selectedSuggestion = suggestionMap.get(index)?.[0];

      if (!selectedSuggestion) {
        return;
      }

      item.identificacionMercanciaItem.subPartidaArancelaria = {
        codigo: selectedSuggestion.cleanCode,
        descripcion: selectedSuggestion.description
      };
    });

    this.currentFormSnapshot = formSnapshot;
    this.currentDamOutput = damOutput;
    this.reviewData.set(this.buildReviewData(damOutput, suggestionMap));
    this.stopProcessing();
    this.showReviewDialog.set(true);
  }

  get timerDisplay(): string {
    const totalSeconds = this.elapsedSeconds();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private buildReviewData(
    damOutput: DamOutputDto,
    suggestionMap: Map<number, GenerateDamArancelOption[]>
  ): GenerateDamReviewData {
    const provider = damOutput.proveedores[0];
    const transactionProvider = damOutput.datosTransacciones[0]?.proveedor;
    const lugares = damOutput.datosGenerales.lugares;

    return {
      proveedor: {
        razonSocial: provider?.razonSocial ?? '',
        calleAvenida: provider?.domicilio.calleAvenida ?? '',
        numero: provider?.domicilio.numero ?? '',
        pais: this.findCountryOption(provider?.domicilio.pais.codigo, provider?.domicilio.pais.descripcion),
        ciudad: this.findSeaportOption(provider?.domicilio.ciudad.codigo, provider?.domicilio.ciudad.descripcion),
        telefonoFax: provider?.domicilio.telefonoFax ?? '',
        nitImportadorConsignatario: damOutput.datosGenerales.operadores.consignatario.numeroDocumento ?? ''
      },
      paisAdquisicion: this.findCountryOption(transactionProvider?.paisAdquisicion.codigo, transactionProvider?.paisAdquisicion.descripcion),
      paisProcedencia: this.findCountryOption(lugares.paisProcedencia.codigo, lugares.paisProcedencia.descripcion),
      paisExportacion: this.findCountryOption(lugares.paisExportacion.codigo, lugares.paisExportacion.descripcion),
      paisTransito: this.findCountryOption(lugares.paisTransito.codigo, lugares.paisTransito.descripcion),
      aduanaIngreso: {
        codigo: lugares.aduanaIngreso.codigo,
        descripcion: lugares.aduanaIngreso.descripcion
      },
      items: damOutput.datosMercancias.map((mercancia, index) => {
        const descriptions = mercancia.identificacionMercanciaItem.descripcionMercanciaComercial.descripcionMinimasMercancias;
        const usoDescription = descriptions.find((item) => item.Uso !== undefined)?.Uso;

        return {
          subPartidaArancelariaCodigo: mercancia.identificacionMercanciaItem.subPartidaArancelaria.codigo,
          subPartidaArancelariaDescripcion: mercancia.identificacionMercanciaItem.subPartidaArancelaria.descripcion,
          arancelSuggestions: suggestionMap.get(index) ?? [],
          selectedArancelOption: this.findArancelOption(
            mercancia.identificacionMercanciaItem.subPartidaArancelaria.codigo,
            suggestionMap.get(index) ?? []
          ),
          especifiqueNombreTxt: descriptions.find((item) => item.especifiqueNombreTxt !== undefined)?.especifiqueNombreTxt ?? '',
          descripcionComercialMercancia: descriptions.find((item) => item.DescripcionComerciallaMercancia !== undefined)?.DescripcionComerciallaMercancia ?? '',
          usoCodigo: usoDescription?.codigo ?? '',
          usoDescripcion: usoDescription?.descripcion ?? '',
          usoEspecifique: usoDescription?.especifique ?? null,
          modelo: descriptions.find((item) => item.Modelo !== undefined)?.Modelo ?? '(-)',
          clase: descriptions.find((item) => item.Clase !== undefined)?.Clase ?? '(-)',
          estadoCodigo: mercancia.identificacionMercanciaItem.estado.codigo,
          estadoDescripcion: mercancia.identificacionMercanciaItem.estado.descripcion
        };
      })
    };
  }

  private mapBatchSuggestions(batchResults: AiPythonArancelBatchResultItemDto[]): Map<number, GenerateDamArancelOption[]> {
    return batchResults.reduce((map, result) => {
      const itemIndex = Number(result.id);

      if (Number.isNaN(itemIndex)) {
        return map;
      }

      const suggestions = (result.partidas ?? [])
        .map((partida) => {
          const cleanCode = normalizeArancelCode(partida.code);

          if (!cleanCode) {
            return null;
          }

          const catalogMatch = this.arancelOptions.find((option) => option.cleanCode === cleanCode);

          return {
            cleanCode,
            description: catalogMatch?.description ?? partida.description ?? ''
          } satisfies GenerateDamArancelOption;
        })
        .filter((item): item is GenerateDamArancelOption => item !== null)
        .filter((item, index, allItems) => allItems.findIndex((candidate) => candidate.cleanCode === item.cleanCode) === index);

      map.set(itemIndex, suggestions);
      return map;
    }, new Map<number, GenerateDamArancelOption[]>());
  }

  private applyReviewDataToOutput(damOutput: DamOutputDto, reviewData: GenerateDamReviewData): void {
    const provider = damOutput.proveedores[0];
    const transaction = damOutput.datosTransacciones[0];

    if (provider) {
      provider.razonSocial = reviewData.proveedor.razonSocial;
      provider.domicilio.calleAvenida = reviewData.proveedor.calleAvenida;
      provider.domicilio.numero = reviewData.proveedor.numero;
      provider.domicilio.pais = { ...reviewData.proveedor.pais };
      provider.domicilio.ciudad = {
        codigo: reviewData.proveedor.ciudad.codigo,
        descripcion: reviewData.proveedor.ciudad.descripcion
      };
      provider.domicilio.telefonoFax = reviewData.proveedor.telefonoFax;
    }

    damOutput.datosGenerales.operadores.importador.numeroDocumento = reviewData.proveedor.nitImportadorConsignatario;
    damOutput.datosGenerales.operadores.consignatario.numeroDocumento = reviewData.proveedor.nitImportadorConsignatario;
    damOutput.datosGenerales.lugares.paisProcedencia = { ...reviewData.paisProcedencia };
    damOutput.datosGenerales.lugares.paisExportacion = { ...reviewData.paisExportacion };
    damOutput.datosGenerales.lugares.paisTransito = { ...reviewData.paisTransito };
    damOutput.datosGenerales.lugares.aduanaIngreso = { ...reviewData.aduanaIngreso };

    if (transaction) {
      transaction.proveedor.razonSocial = reviewData.proveedor.razonSocial;
      transaction.proveedor.paisAdquisicion = { ...reviewData.paisAdquisicion };
    }

    reviewData.items.forEach((reviewItem, index) => {
      const mercancia = damOutput.datosMercancias[index];

      if (!mercancia) {
        return;
      }

      mercancia.identificacionMercanciaItem.subPartidaArancelaria = {
        codigo: reviewItem.subPartidaArancelariaCodigo,
        descripcion: reviewItem.subPartidaArancelariaDescripcion
      };
      mercancia.identificacionMercanciaItem.estado = {
        codigo: reviewItem.estadoCodigo,
        descripcion: reviewItem.estadoDescripcion
      };

      const descriptions = mercancia.identificacionMercanciaItem.descripcionMercanciaComercial.descripcionMinimasMercancias;
      this.upsertDescription(descriptions, 'especifiqueNombreTxt', reviewItem.especifiqueNombreTxt);
      this.upsertDescription(descriptions, 'DescripcionComerciallaMercancia', reviewItem.descripcionComercialMercancia);
      this.upsertDescription(descriptions, 'Modelo', reviewItem.modelo);
      this.upsertDescription(descriptions, 'Clase', reviewItem.clase);

      const usoIndex = descriptions.findIndex((item) => item.Uso !== undefined);
      const usoValue = {
        codigo: reviewItem.usoCodigo,
        descripcion: reviewItem.usoDescripcion,
        especifique: reviewItem.usoCodigo === '99' ? reviewItem.usoEspecifique : null
      };

      if (usoIndex > -1) {
        descriptions[usoIndex].Uso = usoValue;
      } else {
        descriptions.push({ Uso: usoValue });
      }
    });
  }

  private upsertDescription(items: DamOutputDto['datosMercancias'][number]['identificacionMercanciaItem']['descripcionMercanciaComercial']['descripcionMinimasMercancias'], key: 'especifiqueNombreTxt' | 'DescripcionComerciallaMercancia' | 'Modelo' | 'Clase', value: string): void {
    const itemIndex = items.findIndex((item) => item[key] !== undefined);

    if (itemIndex > -1) {
      items[itemIndex][key] = value;
      return;
    }

    items.push({ [key]: value });
  }

  private findCountryOption(codigo?: string | null, descripcion?: string | null): GenerateDamCountryOption {
    return this.countries.find((country) => country.codigo === codigo) ?? { codigo: codigo ?? getCountryCode(descripcion), descripcion: descripcion ?? '' };
  }

  private findSeaportOption(codigo?: string | null, descripcion?: string | null): GenerateDamSeaportOption {
    return this.seaports.find((seaport) => seaport.codigo === codigo)
      ?? (() => {
        const seaport = getSeaportCode(descripcion);
        return {
          codigo: codigo ?? seaport.code,
          descripcion: descripcion ?? seaport.city,
          label: `${codigo ?? seaport.code} - ${descripcion ?? seaport.city}`
        };
      })();
  }

  private updateModalidadRegimenOptions(destinoCodigo: string | null): void {
    const control = this.generateDamForm.controls.modalidadRegimen;

    if (!destinoCodigo) {
      this.modalidadRegimenOptions.set([]);
      control.setValue(null, { emitEvent: false });
      control.disable({ emitEvent: false });
      return;
    }

    const options = this.modalidadRegimenOptionsBase.filter((option) => option.codigo.startsWith(destinoCodigo));
    this.modalidadRegimenOptions.set(options);

    if (!options.some((option) => option.codigo === control.value)) {
      control.setValue(null, { emitEvent: false });
    }

    control.enable({ emitEvent: false });
  }

  private syncDepositoControls(destinoCodigo: string | null): void {
    const destinoRegimenPosterior = this.generateDamForm.controls.destinoRegimenPosterior;
    const modalidadDespachoPosterior = this.generateDamForm.controls.modalidadDespachoPosterior;
    const modalidadDespacho = this.generateDamForm.controls.modalidadDespacho;

    if (destinoCodigo === '70') {
      destinoRegimenPosterior.enable({ emitEvent: false });
      destinoRegimenPosterior.setValidators([Validators.required]);
      modalidadDespachoPosterior.enable({ emitEvent: false });
      modalidadDespachoPosterior.setValidators([Validators.required]);
      modalidadDespacho.disable({ emitEvent: false });
      modalidadDespacho.clearValidators();
    } else {
      destinoRegimenPosterior.disable({ emitEvent: false });
      destinoRegimenPosterior.setValue(null, { emitEvent: false });
      destinoRegimenPosterior.clearValidators();
      modalidadDespachoPosterior.disable({ emitEvent: false });
      modalidadDespachoPosterior.setValue(null, { emitEvent: false });
      modalidadDespachoPosterior.clearValidators();
      modalidadDespacho.enable({ emitEvent: false });
      modalidadDespacho.setValidators([Validators.required]);
    }

    destinoRegimenPosterior.updateValueAndValidity({ emitEvent: false });
    modalidadDespachoPosterior.updateValueAndValidity({ emitEvent: false });
    modalidadDespacho.updateValueAndValidity({ emitEvent: false });
  }

  private syncEmisionParteRecepcionState(): void {
    const control = this.generateDamForm.controls.emisionParteRecepcion;

    if (this.generateDamForm.controls.destinoRegimenAduanero.value === '70') {
      control.enable({ emitEvent: false });
    } else {
      control.setValue(null, { emitEvent: false });
      control.disable({ emitEvent: false });
    }

    control.updateValueAndValidity({ emitEvent: false });
    this.syncTipoMercaderiaState();
  }

  private syncTipoMercaderiaState(): void {
    const control = this.generateDamForm.controls.tipoMercaderia;

    if (this.generateDamForm.controls.emisionParteRecepcion.value === '1') {
      control.enable({ emitEvent: false });
    } else {
      control.setValue(null, { emitEvent: false });
      control.disable({ emitEvent: false });
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private refreshDynamicSelectOptions(): void {
    const modalidadRegimenCodigo = this.generateDamForm.controls.modalidadRegimen.value;
    const destinoRegimenPosteriorCodigo = this.generateDamForm.controls.destinoRegimenPosterior.value;

    const modalidadDespachoByRegimen: Record<string, string[]> = {
      '4000': ['02', '03'],
      '4001': ['01'],
      '5100': ['02']
    };

    const modalidadDespachoAllowed = modalidadRegimenCodigo ? modalidadDespachoByRegimen[modalidadRegimenCodigo] : null;
    const modalidadDespachoOptions = modalidadDespachoAllowed
      ? this.modalidadDespachoOptionsBase.filter((option) => modalidadDespachoAllowed.includes(option.codigo))
      : this.modalidadDespachoOptionsBase;
    this.modalidadDespachoOptions.set(modalidadDespachoOptions);
    this.resetControlIfSelectionIsInvalid(this.generateDamForm.controls.modalidadDespacho, modalidadDespachoOptions);

    const destinoRegimenPosteriorOptions = modalidadRegimenCodigo === '7000'
      ? this.destinoRegimenPosteriorOptionsBase
      : this.destinoRegimenPosteriorOptionsBase.filter((option) => option.codigo !== '95');
    this.destinoRegimenPosteriorOptions.set(destinoRegimenPosteriorOptions);
    this.resetControlIfSelectionIsInvalid(this.generateDamForm.controls.destinoRegimenPosterior, destinoRegimenPosteriorOptions);

    const modalidadDespachoPosteriorOptions = destinoRegimenPosteriorCodigo !== null && ['40', '51'].includes(destinoRegimenPosteriorCodigo)
      ? this.modalidadDespachoPosteriorOptionsBase
      : this.modalidadDespachoPosteriorOptionsBase.filter((option) => option.codigo === '01');
    this.modalidadDespachoPosteriorOptions.set(modalidadDespachoPosteriorOptions);
    this.resetControlIfSelectionIsInvalid(this.generateDamForm.controls.modalidadDespachoPosterior, modalidadDespachoPosteriorOptions);
  }

  private resetControlIfSelectionIsInvalid(
    control: { value: string | null; setValue(value: string | null, options?: { emitEvent?: boolean }): void },
    options: GenerateDamOption[]
  ): void {
    if (control.value && !options.some((option) => option.codigo === control.value)) {
      control.setValue(null, { emitEvent: false });
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.elapsedSeconds.set(0);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update((seconds) => seconds + 1);
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.elapsedSeconds.set(0);
  }

  private stopProcessing(): void {
    this.stopTimer();
    this.isSubmitting.set(false);
  }

  private findArancelOption(
    cleanCode: string | null | undefined,
    itemSuggestions: GenerateDamArancelOption[] = []
  ): GenerateDamArancelOption | null {
    if (!cleanCode) {
      return null;
    }

    return itemSuggestions.find((suggestion) => suggestion.cleanCode === cleanCode)
      ?? this.arancelOptions.find((option) => option.cleanCode === cleanCode)
      ?? null;
  }
}
