import { computed, Injectable, signal } from '@angular/core';

import { LoginRequest, SessionIdentityDto } from './auth.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'frontend-seed-session';
  private readonly _currentUser = signal<SessionIdentityDto | null>(this.loadSession());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  login(request: LoginRequest): boolean {
    const isValidUser = request.user === 'admin' && request.password === '123';

    if (!isValidUser) {
      return false;
    }

    const session: SessionIdentityDto = {
      userName: 'admin',
      role: 'Admin',
      fullName: 'System Admin'
    };

    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this._currentUser.set(session);

    return true;
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this._currentUser.set(null);
  }

  private loadSession(): SessionIdentityDto | null {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as SessionIdentityDto;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
