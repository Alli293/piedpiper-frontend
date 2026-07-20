import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';

const MENSAJE_EXPIRACION = 'Tu sesión expiró. Inicia sesión nuevamente.';

export const sesionInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);
  const teniaToken = Boolean(authService.token());

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const renovado = event.headers.get('X-Refresh-Token');
        if (renovado) {
          authService.renovarToken(renovado);
        }
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && teniaToken) {
        authService.cerrarSesion();
        toastService.error(MENSAJE_EXPIRACION);
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
