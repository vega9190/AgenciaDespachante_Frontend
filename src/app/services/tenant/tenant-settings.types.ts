export interface TenantIdentityDto {
  name: string;
  logoDataUrl: string | null;
  favIcoDataUrl: string | null;
}

export interface TenantSettingsDto {
  officialExchangeRate: number;
  parallelExchangeRate: number;
  defaultImportCharge: number;
  insuranceRate: number;
  iva: number;
  ice: number;
}

export interface UpdateTenantSettingsRequest {
  officialExchangeRate: number;
  parallelExchangeRate: number;
  defaultImportCharge: number;
  insuranceRate: number;
  iva: number;
  ice: number;
}

export interface UploadTenantLogoRequest {
  logo: File;
}

export interface UploadTenantFavIcoRequest {
  favIco: File;
}

export interface DolarApiRateDto {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}
