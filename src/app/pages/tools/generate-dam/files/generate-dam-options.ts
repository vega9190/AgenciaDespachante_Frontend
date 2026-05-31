import { GenerateDamOption } from '@models/generate-dam/generate-dam-option.models';

export const GENERATE_DAM_OPTIONS = {
  condicionVendedor: [
    { codigo: '01', descripcion: 'FABRICANTE' },
    { codigo: '02', descripcion: 'DISTRIBUIDOR' },
    { codigo: '03', descripcion: 'COMERCIANTE' },
    { codigo: '04', descripcion: 'OTRO(ESPECIFIQUE)' }
  ] as GenerateDamOption[],
  condicionEntrega: [
    { codigo: 'FOB', descripcion: 'LIBRE A BORDO' },
    { codigo: 'CFR', descripcion: 'COSTO Y FLETE' },
    { codigo: 'CIF', descripcion: 'COSTO, SEGURO Y FLETE' }
  ] as GenerateDamOption[],
  naturalezaTransaccion: [
    {
      codigo: '01',
      descripcion: 'COMPRAVENTA A PRECIO FIRME PARA LA EXPORTACION HACIA EL TERRITORIO ADUANERO DE LA COMUNIDAD ANDINA'
    },
    { codigo: '999', descripcion: 'OTROS' }
  ] as GenerateDamOption[],
  destinoMercaderia: [
    { codigo: '01', descripcion: 'USO O CONSUMO PROPIO' },
    { codigo: '02', descripcion: 'REVENTA MAYORISTA' },
    { codigo: '03', descripcion: 'REVENTA DETALLE' },
    { codigo: '04', descripcion: 'OTRO' }
  ] as GenerateDamOption[],
  formaPago: [
    { codigo: '1', descripcion: 'PAGO ANTICIPADO' },
    { codigo: '2', descripcion: 'PAGO AL CONTADO' },
    { codigo: '3', descripcion: 'PAGO A CREDITO' },
    { codigo: '4', descripcion: 'PAGO MIXTO (ESPECIFIQUE)' },
    { codigo: '5', descripcion: 'SIN PAGO' },
    { codigo: '6', descripcion: 'OTRO' }
  ] as GenerateDamOption[],
  medioPago: [
    { codigo: '1', descripcion: 'EFECTIVO' },
    { codigo: '2', descripcion: 'CHEQUE' },
    { codigo: '3', descripcion: 'ORDEN DE PAGO SIMPLE - TRANSFERENCIA BANCARIA' },
    { codigo: '4', descripcion: 'REMESA SIMPLE' },
    { codigo: '5', descripcion: 'REMESA DOCUMENTARIA' },
    { codigo: '6', descripcion: 'CREDITO DOCUMENTARIO' },
    { codigo: '7', descripcion: 'OTRO' }
  ] as GenerateDamOption[],
  unidadComercial: [
    { codigo: 'NMB', descripcion: 'UNIDAD (NUMERO DE UNIDADES)' },
    { codigo: 'KGM', descripcion: 'KILOGRAMO' }
  ] as GenerateDamOption[],
  embalaje: [
    { codigo: 'NE', descripcion: 'NO EMPACADO' },
    { codigo: 'PX', descripcion: 'PALLET' }
  ] as GenerateDamOption[],
  estadoMercaderia: [
    { codigo: '1', descripcion: 'NUEVA' },
    { codigo: '2', descripcion: 'USADA' },
    { codigo: '3', descripcion: 'OBSOLETA' },
    { codigo: '4', descripcion: 'DESARMADA/NUEVA' },
    { codigo: '5', descripcion: 'DESARMADA/USADA' },
    { codigo: '6', descripcion: 'SEMIARMADA/NUEVA' },
    { codigo: '7', descripcion: 'SEMIARMADA/USADA' },
    { codigo: '8', descripcion: 'AVERIADA, DANADA O DETERIORADA' },
    { codigo: '9', descripcion: 'REPARADA, REACONDICIONADA' },
    { codigo: '10', descripcion: 'REMANUFACTURADA' },
    { codigo: '11', descripcion: 'VIVO' },
    { codigo: '12', descripcion: 'FRESCO O CONSERVADO' },
    { codigo: '13', descripcion: 'OTRO' }
  ] as GenerateDamOption[],
  uso: [
    { codigo: '1', descripcion: 'AGRICOLA' },
    { codigo: '2', descripcion: 'CONSTRUCCION' },
    { codigo: '3', descripcion: 'CONSUMO ANIMAL' },
    { codigo: '4', descripcion: 'CONSUMO HUMANO' },
    { codigo: '5', descripcion: 'DOMESTICO' },
    { codigo: '6', descripcion: 'ELABORACION DE ALIMENTOS' },
    { codigo: '7', descripcion: 'ESTETICA Y COSMETICA' },
    { codigo: '8', descripcion: 'FARMACEUTICA' },
    { codigo: '9', descripcion: 'INDUSTRIAL' },
    { codigo: '10', descripcion: 'MINERIA' },
    { codigo: '11', descripcion: 'VETERINARIO' },
    { codigo: '99', descripcion: 'OTRO' }
  ] as GenerateDamOption[],
  destinoRegimenAduanero: [
    { codigo: '40', descripcion: 'IMPORTACION PARA EL CONSUMO' },
    { codigo: '51', descripcion: 'ADMISION TEMPORAL RITEX' },
    { codigo: '70', descripcion: 'DEPOSITO DE ADUANA' }
  ] as GenerateDamOption[],
  destinoRegimenPosteriorDeposito: [
    { codigo: '40', descripcion: 'IMPORTACION PARA EL CONSUMO' },
    { codigo: '50', descripcion: 'ADMISION TEMPORAL PARA REEXPORTACION EN' },
    { codigo: '51', descripcion: 'ADMISION TEMPORAL RITEX' },
    { codigo: '60', descripcion: 'REIMPORTACION' },
    { codigo: '95', descripcion: 'TIENDAS LIBRES DE TRIBUTOS (DUTTY FREE SHOPS)' },
    { codigo: '96', descripcion: 'FERIAS INTERNACIONALES' }
  ] as GenerateDamOption[],
  modalidadRegimen: [
    { codigo: '4000', descripcion: 'GENERAL' },
    { codigo: '4001', descripcion: 'DESPACHO ABREVIADO' },
    { codigo: '7000', descripcion: 'DEPOSITO TEMPORAL' },
    { codigo: '7001', descripcion: 'DEPOSITO TRANSITORIO' },
    { codigo: '7002', descripcion: 'DEPOSITO ESPECIAL' },
    { codigo: '5100', descripcion: 'ADMISION TEMPORAL PARA PERFECCIONAMIENTO ACTIVO RITEX' }
  ] as GenerateDamOption[],
  modalidadDespacho: [
    { codigo: '01', descripcion: 'GENERAL' },
    { codigo: '02', descripcion: 'ANTICIPADO' },
    { codigo: '03', descripcion: 'INMEDIATO' }
  ] as GenerateDamOption[],
  modalidadDespachoPosteriorDeposito: [
    { codigo: '01', descripcion: 'GENERAL' },
    { codigo: '03', descripcion: 'INMEDIATO' }
  ] as GenerateDamOption[],
  emisionParteRecepcion: [
    { codigo: '1', descripcion: 'SIN DESCARGA' },
    { codigo: '2', descripcion: 'CON DESCARGA' }
  ] as GenerateDamOption[],
  tipoMercaderia: [
    { codigo: '1', descripcion: 'A GRANEL' },
    { codigo: '2', descripcion: 'ANIMALES VIVOS' },
    { codigo: '3', descripcion: 'CORROSIVOS' },
    { codigo: '4', descripcion: 'EXPLOSIVOS' },
    { codigo: '5', descripcion: 'FACIL RECONOCIMIENTO' },
    { codigo: '6', descripcion: 'GRAN VOLUMEN' },
    { codigo: '7', descripcion: 'HOMOGENEAS' },
    { codigo: '8', descripcion: 'INGLAMABLES' }
  ] as GenerateDamOption[],
  aduanaDespacho: [
    { codigo: '701', descripcion: 'INTERIOR SANTA CRUZ' },
    { codigo: '999', descripcion: 'OTROS' }
  ] as GenerateDamOption[],
  aduanaIngreso: [
    { codigo: '421', descripcion: 'FRONTERA PISIGA' },
    { codigo: '422', descripcion: 'FRONTERA TAMBO QUEMADO' }
  ] as GenerateDamOption[],
  formaEnvio: [
    { codigo: '01', descripcion: 'ENVIOS PARCIALES O FRACCIONADOS' },
    { codigo: '02', descripcion: 'ENVIO TOTAL' }
  ] as GenerateDamOption[],
  transporteModo: [
    { codigo: '3', descripcion: 'TRANSPORTE CARRETERO' },
    { codigo: '6', descripcion: 'TRANSPORTE MULTIMODAL' }
  ] as GenerateDamOption[]
} as const;
