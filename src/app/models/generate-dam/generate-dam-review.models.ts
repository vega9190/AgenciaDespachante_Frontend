import {
  GenerateDamArancelOption,
  GenerateDamCountryOption,
  GenerateDamSeaportOption
} from './generate-dam-option.models';

export interface GenerateDamReviewItem {
  subPartidaArancelariaCodigo: string;
  subPartidaArancelariaDescripcion: string;
  selectedArancelOption: GenerateDamArancelOption | null;
  arancelSuggestions: GenerateDamArancelOption[];
  especifiqueNombreTxt: string;
  descripcionComercialMercancia: string;
  usoCodigo: string;
  usoDescripcion: string;
  usoEspecifique: string | null;
  modelo: string;
  clase: string;
  estadoCodigo: string;
  estadoDescripcion: string;
}

export interface GenerateDamReviewProvider {
  razonSocial: string;
  calleAvenida: string;
  numero: string;
  pais: GenerateDamCountryOption;
  ciudad: GenerateDamSeaportOption;
  telefonoFax: string;
  nitImportadorConsignatario: string;
}

export interface GenerateDamReviewData {
  proveedor: GenerateDamReviewProvider;
  paisAdquisicion: GenerateDamCountryOption;
  paisProcedencia: GenerateDamCountryOption;
  paisExportacion: GenerateDamCountryOption;
  paisTransito: GenerateDamCountryOption;
  aduanaIngreso: { codigo: string; descripcion: string };
  items: GenerateDamReviewItem[];
}
