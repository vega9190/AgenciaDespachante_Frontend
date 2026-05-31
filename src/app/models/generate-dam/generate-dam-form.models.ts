import { FormControl } from '@angular/forms';

export interface GenerateDamFormValue {
  factura: string;
  bol: string;
  numeroReferencia: string;
  formaEnvio: string | null;
  cargaConsolidada: boolean;
  destinoRegimenAduanero: string | null;
  modalidadRegimen: string | null;
  modalidadDespacho: string | null;
  destinoRegimenPosterior: string | null;
  modalidadDespachoPosterior: string | null;
  desdeFrontera: string | null;
  hastaFrontera: string | null;
  emisionParteRecepcion: string | null;
  tipoMercaderia: string | null;
  vieneZonaFranca: boolean;
  correoElectronico: string;
  condicionVendedor: string | null;
  condicionEntrega: string | null;
  destinoMercaderia: string | null;
  formaPago: string | null;
  medioPago: string | null;
  unidadComercial: string | null;
  embalaje: string | null;
  estadoMercaderia: string | null;
  uso: string | null;
}

export interface GenerateDamFormModel {
  factura: FormControl<string>;
  bol: FormControl<string>;
  numeroReferencia: FormControl<string>;
  formaEnvio: FormControl<string | null>;
  cargaConsolidada: FormControl<boolean>;
  destinoRegimenAduanero: FormControl<string | null>;
  modalidadRegimen: FormControl<string | null>;
  modalidadDespacho: FormControl<string | null>;
  destinoRegimenPosterior: FormControl<string | null>;
  modalidadDespachoPosterior: FormControl<string | null>;
  desdeFrontera: FormControl<string | null>;
  hastaFrontera: FormControl<string | null>;
  emisionParteRecepcion: FormControl<string | null>;
  tipoMercaderia: FormControl<string | null>;
  vieneZonaFranca: FormControl<boolean>;
  correoElectronico: FormControl<string>;
  condicionVendedor: FormControl<string | null>;
  condicionEntrega: FormControl<string | null>;
  destinoMercaderia: FormControl<string | null>;
  formaPago: FormControl<string | null>;
  medioPago: FormControl<string | null>;
  unidadComercial: FormControl<string | null>;
  embalaje: FormControl<string | null>;
  estadoMercaderia: FormControl<string | null>;
  uso: FormControl<string | null>;
}
