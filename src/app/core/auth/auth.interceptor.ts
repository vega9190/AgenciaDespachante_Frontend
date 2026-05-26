import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ApiResult } from '@models/api.types';
import { AppToastService } from '@services/common/app-toast.service';
import { environment } from '../../../environments/environment';

import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url === `${environment.apiUrl}/api/Auth/login`) {
    return next(request);
  }

  const authService = inject(AuthService);
  const appToastService = inject(AppToastService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  ).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          authService.logout();
          void router.navigate(['/login']);
        }

        if (error.status === 500) {
          const apiResult = readApiResult(error);

          if (apiResult?.messageList?.length) {
            appToastService.showApiMessages(apiResult);
          } else {
            appToastService.showServerError();
          }
        }
      }

      return throwError(() => error);
    })
  );
};

function readApiResult(error: HttpErrorResponse): ApiResult | null {
  const payload = error.error;

  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as ApiResult).messageList)) {
    return null;
  }

  return payload as ApiResult;
}
