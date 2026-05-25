import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../../environments/environment';

import { ApiResultOf } from '@models/api.types';

import { LoginApiRequest, LoginResponseDto } from './auth-api.types';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authUrl = `${environment.apiUrl}/api/Auth`;

  login(request: LoginApiRequest) {
    return this.httpClient.post<ApiResultOf<LoginResponseDto>>(`${this.authUrl}/login`, request);
  }
}
