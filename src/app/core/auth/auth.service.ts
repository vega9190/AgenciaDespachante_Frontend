import { computed, Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiResultOf } from '@models/api.types';
import { AuthApiService } from '@services/auth/auth-api.service';
import { LoginResponseDto } from '@services/auth/auth-api.types';

import { LoginRequest, SessionIdentityDto } from './auth.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authApiService = inject(AuthApiService);
  private readonly storageKey = 'agencia-despachante-session';
  private readonly _currentUser = signal<SessionIdentityDto | null>(this.loadSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser()?.accessToken);

  async login(request: LoginRequest): Promise<boolean> {
    let response: ApiResultOf<LoginResponseDto>;

    try {
      response = await firstValueFrom(this.authApiService.login({ username: request.user, password: request.password }));
    } catch {
      return false;
    }

    if (!response.isValid || !response.data) {
      return false;
    }

    this.persistSession(this.mapLoginResponseToSession(response));

    return true;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this._currentUser.set(null);
  }

  getAccessToken(): string | null {
    return this._currentUser()?.accessToken ?? null;
  }

  private persistSession(session: SessionIdentityDto): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this._currentUser.set(session);
  }

  private loadSession(): SessionIdentityDto | null {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      const session = JSON.parse(rawValue) as SessionIdentityDto;

      if (!session.accessToken) {
        localStorage.removeItem(this.storageKey);
        return null;
      }

      return session;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private mapLoginResponseToSession(response: ApiResultOf<LoginResponseDto>): SessionIdentityDto {
    const loginData = response.data as LoginResponseDto;
    const fullName = [loginData.firstName, loginData.lastName].filter(Boolean).join(' ').trim();

    return {
      accessToken: loginData.accessToken,
      expiresAtUtc: loginData.expiresAtUtc,
      userName: loginData.username,
      firstName: loginData.firstName,
      lastName: loginData.lastName,
      fullName: fullName || loginData.username,
      role: loginData.role,
      initials: buildInitials(loginData.firstName, loginData.lastName, loginData.username)
    };
  }
}

function buildInitials(firstName: string, lastName: string, username: string): string {
  const names = [firstName, lastName].filter((value) => !!value.trim());

  if (names.length > 0) {
    return names.slice(0, 2).map((value) => value.trim().charAt(0).toUpperCase()).join('');
  }

  return username.trim().slice(0, 2).toUpperCase();
}
