import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { ApiResultOf } from '@models/api.types';

import { environment } from '../../../environments/environment';

import {
  TenantIdentityDto,
  TenantSettingsDto,
  UpdateTenantSettingsRequest,
  UploadTenantFavIcoRequest,
  UploadTenantLogoRequest
} from './tenant-settings.types';

@Injectable({
  providedIn: 'root'
})
export class TenantSettingsService {
  private readonly httpClient = inject(HttpClient);
  private readonly tenantUrl = `${environment.apiUrl}/api/tenant`;

  getIdentity() {
    return this.httpClient.get<ApiResultOf<TenantIdentityDto>>(`${this.tenantUrl}/identity`);
  }

  getSettings() {
    return this.httpClient.get<ApiResultOf<TenantSettingsDto>>(`${this.tenantUrl}/settings`);
  }

  updateSettings(request: UpdateTenantSettingsRequest) {
    return this.httpClient.put<ApiResultOf<null>>(`${this.tenantUrl}/settings`, request);
  }

  uploadLogo(request: UploadTenantLogoRequest) {
    const formData = new FormData();
    formData.set('logo', request.logo);

    return this.httpClient.put<ApiResultOf<null>>(`${this.tenantUrl}/settings/logo`, formData);
  }

  deleteLogo() {
    return this.httpClient.delete<ApiResultOf<null>>(`${this.tenantUrl}/settings/logo`);
  }

  uploadFavIco(request: UploadTenantFavIcoRequest) {
    const formData = new FormData();
    formData.set('favIco', request.favIco);

    return this.httpClient.put<ApiResultOf<null>>(`${this.tenantUrl}/settings/favico`, formData);
  }

  deleteFavIco() {
    return this.httpClient.delete<ApiResultOf<null>>(`${this.tenantUrl}/settings/favico`);
  }
}
