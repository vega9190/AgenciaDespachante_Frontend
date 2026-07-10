import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles: string[] = route.data['roles'] ?? [];

  if (roles.length === 0 || authService.hasRole(...roles)) {
    return true;
  }

  return router.createUrlTree([authService.getHomeRoute()]);
};
