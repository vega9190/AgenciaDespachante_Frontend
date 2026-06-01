export interface TenantIdentityDto {
  name: string;
  logoDataUrl: string | null;
  favIcoDataUrl: string | null;
}

export interface TenantSettingsDto {
  displayName: string;
  exchangeRate: number;
  logoDataUrl: string | null;
}

export interface UpdateTenantSettingsRequest {
  displayName: string;
  exchangeRate: number;
}

export interface UploadTenantLogoRequest {
  logo: File;
}
