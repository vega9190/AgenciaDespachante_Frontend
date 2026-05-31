import { BolDto, InvoiceDto } from '@services/ai/ai.types';

import { GenerateDamFormValue } from '@models/generate-dam/generate-dam-form.models';
import {
  CodigoDescripcionDto,
  DamOutputDto,
  DescripcionMinimaDto,
  DomicilioDto,
  IdentificacionDeclaracionDto,
  LugaresDto,
  OperadoresDto,
  ProveedorTransaccionDto,
  DetalleTransaccionDto,
  DetallePagoTransaccionDto,
  TransporteDto
} from '@models/generate-dam/generate-dam-output.models';
import { GenerateDamOption } from '@models/generate-dam/generate-dam-option.models';

import { getCountryCode, getSeaportCode } from './generate-dam.utils';

interface GenerateDamBuilderOptions {
  condicionVendedor: GenerateDamOption[];
  condicionEntrega: GenerateDamOption[];
  naturalezaTransaccion: GenerateDamOption[];
  destinoMercaderia: GenerateDamOption[];
  formaPago: GenerateDamOption[];
  medioPago: GenerateDamOption[];
  unidadComercial: GenerateDamOption[];
  embalaje: GenerateDamOption[];
  estadoMercaderia: GenerateDamOption[];
  uso: GenerateDamOption[];
  destinoRegimenAduanero: GenerateDamOption[];
  modalidadRegimen: GenerateDamOption[];
  modalidadDespacho: GenerateDamOption[];
  destinoRegimenPosterior: GenerateDamOption[];
  modalidadDespachoPosterior: GenerateDamOption[];
  emisionParteRecepcion: GenerateDamOption[];
  tipoMercaderia: GenerateDamOption[];
  formaEnvio: GenerateDamOption[];
  transporteModo: GenerateDamOption[];
}

export class GenerateDamOutputBuilder {
  constructor(
    private readonly invoice: InvoiceDto,
    private readonly bol: BolDto,
    private readonly options: GenerateDamBuilderOptions
  ) {}

  build(formData: GenerateDamFormValue & { usoEspecifique: string | null }): DamOutputDto {
    return {
      versionExcel: '2.11',
      datosGenerales: {
        identificacionDeclaracion: this.buildIdentificacionDeclaracion(formData),
        operadores: this.buildOperadores(),
        lugares: this.buildLugares(),
        transporte: this.buildTransporte(formData)
      },
      totalControlDeclaracion: {
        totalFob: this.toStringNumber(this.invoice.totalAmount),
        totalBultos: this.toStringNumber(this.bol.totalPackages),
        totalPesoBruto: this.toStringNumber(this.bol.totalWeight)
      },
      proveedores: [
        {
          razonSocial: (this.invoice.provider?.name ?? '').toUpperCase(),
          domicilio: this.buildProveedorDomicilio(formData)
        }
      ],
      datosTransacciones: [
        {
          proveedor: this.buildProveedorTransaccion(formData),
          detalleTransaccion: this.buildDetalleTransaccion(formData),
          detallePagoTransaccion: this.buildDetallePagoTransaccion(formData),
          valoresCostos: {
            valorFobTotalUsd: this.toStringNumber(this.invoice.totalAmount),
            valorCifTotalUsd: 0
          },
          totalesControl: {
            numeroPaginas: '1',
            totalItems: this.toStringNumber(this.invoice.totalItems),
            totalPesoNeto: this.toStringNumber(this.bol.totalWeight)
          }
        }
      ],
      datosMercancias: this.buildDatosMercancias(formData)
    };
  }

  private findOption(codigo: string | null | undefined, options: GenerateDamOption[]): CodigoDescripcionDto {
    const option = options.find((item) => item.codigo === codigo);

    return {
      codigo: option?.codigo ?? codigo ?? '',
      descripcion: option?.descripcion ?? ''
    };
  }

  private buildIdentificacionDeclaracion(
    formData: GenerateDamFormValue & { usoEspecifique: string | null }
  ): IdentificacionDeclaracionDto {
    const isDepositoAduana = formData.destinoRegimenAduanero === '70';

    return {
      numeroReferencia: formData.numeroReferencia,
      aduanaDespacho: {
        codigo: '701',
        descripcion: 'INTERIOR SANTA CRUZ'
      },
      formaEnvio: this.findOption(formData.formaEnvio, this.options.formaEnvio),
      cargaConsolidada: {
        codigo: formData.cargaConsolidada ? '1' : '2',
        descripcion: formData.cargaConsolidada ? 'SI' : 'NO'
      },
      destinoRegimenAduanero: this.findOption(formData.destinoRegimenAduanero, this.options.destinoRegimenAduanero),
      modalidadDespacho: isDepositoAduana ? null : this.findOption(formData.modalidadDespacho, this.options.modalidadDespacho),
      modalidadRegimen: this.findOption(formData.modalidadRegimen, this.options.modalidadRegimen),
      desRegPos: isDepositoAduana ? this.findOption(formData.destinoRegimenPosterior, this.options.destinoRegimenPosterior) : null,
      modDesPos: isDepositoAduana ? this.findOption(formData.modalidadDespachoPosterior, this.options.modalidadDespachoPosterior) : null,
      tipoDam: 'POSTERIOR',
      emiParRec: this.findOption(formData.emisionParteRecepcion, this.options.emisionParteRecepcion),
      tipMer: formData.tipoMercaderia ? [this.findOption(formData.tipoMercaderia, this.options.tipoMercaderia)] : null
    };
  }

  private buildOperadores(): OperadoresDto {
    return {
      importador: {
        numeroDocumento: this.bol.shipperDocNumber ?? '',
        tipoDocumento: {
          codigo: 'NIT',
          descripcion: 'NUMERO DE IDENTIFICACION TRIBUTARIA'
        }
      },
      consignatario: {
        numeroDocumento: this.bol.consigneeDocNumber ?? '',
        tipoDocumento: {
          codigo: 'NIT',
          descripcion: 'NUMERO DE IDENTIFICACION TRIBUTARIA'
        }
      }
    };
  }

  private buildLugares(): LugaresDto {
    return {
      paisExportacion: {
        codigo: getCountryCode(this.bol.place?.destinationCountry),
        descripcion: (this.bol.place?.destinationCountry ?? '').toUpperCase()
      },
      paisProcedencia: {
        codigo: getCountryCode(this.bol.place?.originCountry),
        descripcion: (this.bol.place?.originCountry ?? '').toUpperCase()
      },
      paisTransito: {
        codigo: getCountryCode(this.bol.place?.transitCountry),
        descripcion: (this.bol.place?.transitCountry ?? '').toUpperCase()
      },
      aduanaIngreso: this.determineAduanaIngreso(),
      aduanaDestino: {
        codigo: '701',
        descripcion: 'INTERIOR SANTA CRUZ'
      },
      lugarEntrega: 'SANTA CRUZ'
    };
  }

  private determineAduanaIngreso(): CodigoDescripcionDto {
    const transitCity = (this.bol.place?.transitCity ?? '').toLowerCase();

    if (transitCity.includes('iquique')) {
      return { codigo: '421', descripcion: 'FRONTERA PISIGA' };
    }

    if (transitCity.includes('arica')) {
      return { codigo: '422', descripcion: 'FRONTERA TAMBO QUEMADO' };
    }

    return { codigo: '421', descripcion: 'FRONTERA PISIGA' };
  }

  private buildTransporte(formData: GenerateDamFormValue): TransporteDto {
    const paisEmbarqueCode = getCountryCode(this.bol.place?.countryOfLoading);
    const lugarEmbarquePort = getSeaportCode(this.bol.place?.portOfLoading);

    return {
      cargaPeligrosa: 'false',
      desdeFrontera: this.findOption(formData.desdeFrontera, this.options.transporteModo),
      hastaFrontera: this.findOption(formData.hastaFrontera, this.options.transporteModo),
      informacionDocumentosEmbarque: [
        {
          fechaEmbarque: this.bol.date ?? '',
          lugarEmbarque: {
            codigo: lugarEmbarquePort.code,
            descripcion: lugarEmbarquePort.city.toUpperCase()
          },
          paisEmbarque: {
            codigo: paisEmbarqueCode,
            descripcion: (this.bol.place?.countryOfLoading ?? '').toUpperCase()
          },
          numeroDocumentoEmbarque: this.bol.bolNumber ?? '',
          tipoDocumentoEmbarque: {
            codigo: 'TR-002',
            descripcion: 'BILL OF LADING (BL) - CONOCIMIENTO DE EMBARQUE MARITIMO'
          },
          provieneZonaFranca: {
            codigo: formData.vieneZonaFranca ? '1' : '2',
            descripcion: formData.vieneZonaFranca ? 'SI' : 'NO'
          }
        }
      ]
    };
  }

  private buildProveedorDomicilio(formData: GenerateDamFormValue): DomicilioDto {
    const countryCode = getCountryCode(this.invoice.provider?.country);
    const seaport = getSeaportCode(this.invoice.provider?.city);

    return {
      calleAvenida: this.invoice.provider?.address ?? '',
      numero: this.invoice.provider?.refNumber ?? '',
      pais: {
        codigo: countryCode,
        descripcion: (this.invoice.provider?.country ?? 'ESTADOS UNIDOS').toUpperCase()
      },
      ciudad: {
        codigo: seaport.code,
        descripcion: seaport.city
      },
      telefonoFax: (this.invoice.provider?.phone ?? '').replace(/\s+/g, '').replace(/-/g, ''),
      correoElectronico: this.invoice.provider?.email ?? formData.correoElectronico
    };
  }

  private buildProveedorTransaccion(formData: GenerateDamFormValue): ProveedorTransaccionDto {
    return {
      numeroDocumento: '',
      razonSocial: (this.invoice.provider?.name ?? '').toUpperCase(),
      condicionVendedor: this.findOption(formData.condicionVendedor, this.options.condicionVendedor),
      paisAdquisicion: {
        codigo: getCountryCode(this.bol.place?.originCountry),
        descripcion: (this.bol.place?.originCountry ?? '').toUpperCase()
      }
    };
  }

  private buildDetalleTransaccion(formData: GenerateDamFormValue): DetalleTransaccionDto {
    return {
      numeroFactura: this.invoice.invoiceNumber ?? '',
      fechaFactura: this.invoice.date ?? '',
      incoterms: {
        condicionEntrega: this.findOption(formData.condicionEntrega, this.options.condicionEntrega),
        lugarEntrega: this.bol.place?.portOfLoading ?? ''
      },
      naturalezaTransaccion: this.findOption('01', this.options.naturalezaTransaccion),
      monedaTransaccion: {
        codigo: 'USD',
        descripcion: 'DOLAR ESTADOUNIDENSE'
      },
      valorTransaccion: this.toStringNumber(this.invoice.totalAmount),
      tipoCambio: '6.96',
      destinoMercancia: this.findOption(formData.destinoMercaderia, this.options.destinoMercaderia),
      facturaSujetoDescuento: 'false'
    };
  }

  private buildDetallePagoTransaccion(formData: GenerateDamFormValue): DetallePagoTransaccionDto {
    return {
      formaPago: this.findOption(formData.formaPago, this.options.formaPago),
      medioPago: this.findOption(formData.medioPago, this.options.medioPago)
    };
  }

  private buildDescripcionMinimasMercancias(
    formData: GenerateDamFormValue & { usoEspecifique: string | null },
    item: NonNullable<InvoiceDto['items']>[number]
  ): DescripcionMinimaDto[] {
    const descriptions: DescripcionMinimaDto[] = [
      {
        NombreMercancia: {
          codigo: 'COMUN',
          descripcion: 'Comunes'
        }
      }
    ];

    if (item.name) {
      descriptions.push({ especifiqueNombreTxt: item.name.toUpperCase() });
    }

    if (item.comercialDescription) {
      descriptions.push({ DescripcionComerciallaMercancia: item.comercialDescription.toUpperCase() });
    }

    if (item.type) {
      descriptions.push({ Tipo: item.type.toUpperCase() });
    }

    if (item.class) {
      descriptions.push({ Clase: item.class.toUpperCase() });
    }

    if (item.model) {
      descriptions.push({ Modelo: item.model.toUpperCase() });
    }

    descriptions.push({ Cuanti1: '(-)' });
    descriptions.push({ Cuanti2: '(-)' });
    descriptions.push({ ForPre: 'UNIDAD' });

    if (item.composition) {
      descriptions.push({ Composicion: item.composition.toUpperCase() });
    }

    descriptions.push({
      Uso: {
        ...this.findOption(formData.uso, this.options.uso),
        especifique: formData.uso === '99' ? formData.usoEspecifique : null
      }
    });

    if (item.otherDetails) {
      descriptions.push({ OtrasCaracteristicas: item.otherDetails.toUpperCase() });
    }

    if (item.year) {
      descriptions.push({ AnoModelo: item.year });
      descriptions.push({ AnoFabMer: item.year });
    }

    return descriptions;
  }

  private buildDatosMercancias(formData: GenerateDamFormValue & { usoEspecifique: string | null }): DamOutputDto['datosMercancias'] {
    const items = this.invoice.items ?? [];
    const totalWeight = this.bol.totalWeight ?? 0;
    const weightDistribution = this.distributeWeightAcrossItems(totalWeight, items);

    return items.map((item, index) => ({
      factura: {
        numeroFactura: this.invoice.invoiceNumber ?? '',
        proveedor: {
          numeroDocumento: '',
          razonSocial: (this.invoice.provider?.name ?? '').toUpperCase()
        }
      },
      identificacionMercanciaItem: {
        subPartidaArancelaria: { codigo: '', descripcion: '' },
        unidadMedida: this.findOption(formData.unidadComercial, this.options.unidadComercial).descripcion,
        unidadFisicaConversion: 0,
        cantidadUnidadFisica: this.toStringNumber(item.quantity, '1'),
        cantidadFisicaConversion: 0,
        unidadComercial: this.findOption(formData.unidadComercial, this.options.unidadComercial),
        cantidadUnidadComercial: this.toStringNumber(item.quantity, '1'),
        precioUnitario: this.toStringNumber(item.unitPrice),
        paisOrigen: {
          codigo: getCountryCode(this.bol.place?.originCountry),
          descripcion: (this.bol.place?.originCountry ?? '').toUpperCase()
        },
        embalaje: {
          ...this.findOption(formData.embalaje, this.options.embalaje),
          tag: 'false'
        },
        pesoNeto: this.toStringNumber(weightDistribution[index]),
        relacionItemBulto: '0',
        estado: this.findOption(formData.estadoMercaderia, this.options.estadoMercaderia),
        descripcionMercanciaComercial: {
          descripcionMinimasMercancias: this.buildDescripcionMinimasMercancias(formData, item),
          tipoMercancia: {
            codigo: 'COMUN',
            descripcion: 'Comunes'
          }
        }
      },
      informacionValoresTransaccionItem: {
        valorTransaccionItemUSD: this.toStringNumber(item.amount),
        valorFOBItemUSD: this.toStringNumber(item.amount),
        valorFOBUnitarioUsd: this.toStringNumber(item.unitPrice)
      }
    }));
  }

  private distributeWeightAcrossItems(totalWeight: number, items: NonNullable<InvoiceDto['items']>): number[] {
    if (items.length === 0 || totalWeight <= 0) {
      return [];
    }

    const isContenedor = (item: NonNullable<InvoiceDto['items']>[number]): boolean => {
      const content = `${item.name ?? ''} ${item.comercialDescription ?? ''}`.toUpperCase();
      return content.includes('CONTENEDOR');
    };

    const contenedorIndices: number[] = [];
    const normalIndices: number[] = [];

    items.forEach((item, index) => {
      if (isContenedor(item)) {
        contenedorIndices.push(index);
      } else {
        normalIndices.push(index);
      }
    });

    const result = new Array(items.length).fill(0);

    contenedorIndices.forEach((index) => {
      result[index] = 3950;
    });

    const availableWeight = totalWeight - contenedorIndices.length * 3950;

    if (normalIndices.length === 0) {
      return result;
    }

    if (availableWeight <= 0) {
      return result;
    }

    if (normalIndices.length === 1) {
      result[normalIndices[0]] = availableWeight;
      return result;
    }

    const totalPrice = normalIndices.reduce((sum, index) => sum + (items[index].unitPrice ?? 0), 0);
    const exactWeights = totalPrice === 0
      ? normalIndices.map(() => availableWeight / normalIndices.length)
      : normalIndices.map((index) => (availableWeight / totalPrice) * (items[index].unitPrice ?? 0));
    const floorWeights = exactWeights.map((value) => Math.floor(value));
    const remainder = availableWeight - floorWeights.reduce((sum, value) => sum + value, 0);
    const fractions = exactWeights
      .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((left, right) => right.fraction - left.fraction);

    for (let currentRemainder = 0; currentRemainder < remainder; currentRemainder++) {
      floorWeights[fractions[currentRemainder].index] += 1;
    }

    const assignedWeight = floorWeights.reduce((sum, value) => sum + value, 0);
    const missingWeight = availableWeight - assignedWeight;

    if (missingWeight !== 0) {
      const maxIndex = floorWeights.indexOf(Math.max(...floorWeights));
      floorWeights[maxIndex] += missingWeight;
    }

    normalIndices.forEach((originalIndex, localIndex) => {
      result[originalIndex] = floorWeights[localIndex];
    });

    return result;
  }

  private toStringNumber(value: number | null | undefined, fallback = '0'): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return fallback;
    }

    return String(value);
  }
}
