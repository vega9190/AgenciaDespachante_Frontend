export interface CodigoDescripcionDto {
  codigo: string;
  descripcion: string;
}

export interface CodigoDescripcionOtroDto {
  codigo: string;
  descripcion: string;
  especifique?: string | null;
}

export interface DamOutputDto {
  versionExcel: string;
  datosGenerales: DatosGeneralesDto;
  totalControlDeclaracion: TotalControlDeclaracionDto;
  proveedores: ProveedorDto[];
  datosTransacciones: DatosTransaccionDto[];
  datosMercancias: DatosMercanciaDto[];
}

export interface DatosGeneralesDto {
  identificacionDeclaracion: IdentificacionDeclaracionDto;
  operadores: OperadoresDto;
  lugares: LugaresDto;
  transporte: TransporteDto;
}

export interface IdentificacionDeclaracionDto {
  numeroReferencia: string;
  aduanaDespacho: CodigoDescripcionDto;
  formaEnvio: CodigoDescripcionDto;
  cargaConsolidada: CodigoDescripcionDto;
  destinoRegimenAduanero: CodigoDescripcionDto;
  modalidadDespacho: CodigoDescripcionDto | null;
  modalidadRegimen: CodigoDescripcionDto;
  desRegPos: CodigoDescripcionDto | null;
  modDesPos: CodigoDescripcionDto | null;
  tipoDam: string;
  emiParRec: CodigoDescripcionDto;
  tipMer: CodigoDescripcionDto[] | null;
}

export interface OperadoresDto {
  importador: OperadorDto;
  consignatario: OperadorDto;
}

export interface OperadorDto {
  numeroDocumento: string;
  tipoDocumento: CodigoDescripcionDto;
}

export interface LugaresDto {
  paisExportacion: CodigoDescripcionDto;
  paisProcedencia: CodigoDescripcionDto;
  paisTransito: CodigoDescripcionDto;
  aduanaIngreso: CodigoDescripcionDto;
  aduanaDestino: CodigoDescripcionDto;
  lugarEntrega: string;
}

export interface TransporteDto {
  cargaPeligrosa: string;
  desdeFrontera: CodigoDescripcionDto;
  hastaFrontera: CodigoDescripcionDto;
  informacionDocumentosEmbarque: DocumentoEmbarqueDto[];
}

export interface DocumentoEmbarqueDto {
  fechaEmbarque: string;
  lugarEmbarque: CodigoDescripcionDto;
  paisEmbarque: CodigoDescripcionDto;
  numeroDocumentoEmbarque: string;
  tipoDocumentoEmbarque: CodigoDescripcionDto;
  provieneZonaFranca: CodigoDescripcionDto;
}

export interface TotalControlDeclaracionDto {
  totalFob: string;
  totalBultos: string;
  totalPesoBruto: string;
}

export interface ProveedorDto {
  razonSocial: string;
  domicilio: DomicilioDto;
}

export interface DomicilioDto {
  calleAvenida: string;
  numero: string;
  pais: CodigoDescripcionDto;
  ciudad: CodigoDescripcionDto;
  telefonoFax: string;
  correoElectronico: string;
}

export interface DatosTransaccionDto {
  proveedor: ProveedorTransaccionDto;
  detalleTransaccion: DetalleTransaccionDto;
  detallePagoTransaccion: DetallePagoTransaccionDto;
  valoresCostos: ValoresCostosDto;
  totalesControl: TotalesControlDto;
}

export interface ProveedorTransaccionDto {
  numeroDocumento: string;
  razonSocial: string;
  condicionVendedor: CodigoDescripcionDto;
  paisAdquisicion: CodigoDescripcionDto;
}

export interface DetalleTransaccionDto {
  numeroFactura: string;
  fechaFactura: string;
  incoterms: IncotermsDto;
  naturalezaTransaccion: CodigoDescripcionDto;
  monedaTransaccion: CodigoDescripcionDto;
  valorTransaccion: string;
  tipoCambio: string;
  destinoMercancia: CodigoDescripcionDto;
  facturaSujetoDescuento: string;
}

export interface IncotermsDto {
  condicionEntrega: CodigoDescripcionDto;
  lugarEntrega: string;
}

export interface DetallePagoTransaccionDto {
  formaPago: CodigoDescripcionDto;
  medioPago: CodigoDescripcionDto;
}

export interface ValoresCostosDto {
  valorFobTotalUsd: string;
  valorCifTotalUsd: number;
}

export interface TotalesControlDto {
  numeroPaginas: string;
  totalItems: string;
  totalPesoNeto: string;
}

export interface DatosMercanciaDto {
  factura: FacturaMercanciaDto;
  identificacionMercanciaItem: IdentificacionMercanciaItemDto;
  informacionValoresTransaccionItem: InformacionValoresTransaccionItemDto;
}

export interface FacturaMercanciaDto {
  numeroFactura: string;
  proveedor: ProveedorSimpleDto;
}

export interface ProveedorSimpleDto {
  numeroDocumento: string;
  razonSocial: string;
}

export interface IdentificacionMercanciaItemDto {
  subPartidaArancelaria: CodigoDescripcionDto;
  unidadMedida: string;
  unidadFisicaConversion: number;
  cantidadUnidadFisica: string;
  cantidadFisicaConversion: number;
  unidadComercial: CodigoDescripcionDto;
  cantidadUnidadComercial: string;
  precioUnitario: string;
  paisOrigen: CodigoDescripcionDto;
  embalaje: EmbalajeDto;
  pesoNeto: string;
  relacionItemBulto: string;
  estado: CodigoDescripcionDto;
  descripcionMercanciaComercial: DescripcionMercanciaComercialDto;
}

export interface EmbalajeDto {
  codigo: string;
  descripcion: string;
  tag: string;
}

export interface DescripcionMercanciaComercialDto {
  descripcionMinimasMercancias: DescripcionMinimaDto[];
  tipoMercancia: CodigoDescripcionDto;
}

export interface DescripcionMinimaDto {
  NombreMercancia?: CodigoDescripcionDto;
  especifiqueNombreTxt?: string;
  DescripcionComerciallaMercancia?: string;
  Tipo?: string;
  Clase?: string;
  Modelo?: string;
  Cuanti1?: string;
  Cuanti2?: string;
  ForPre?: string;
  Composicion?: string;
  Uso?: CodigoDescripcionOtroDto;
  OtrasCaracteristicas?: string;
  AnoModelo?: string;
  AnoFabMer?: string;
}

export interface InformacionValoresTransaccionItemDto {
  valorTransaccionItemUSD: string;
  valorFOBItemUSD: string;
  valorFOBUnitarioUsd: string;
}
