import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SesionInactividadService } from './sesion-inactividad.service';

export const sesionInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const sesionInactividadService = inject(SesionInactividadService);

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
      if (error instanceof HttpErrorResponse && error.status === 401 && authService.token()) {
        sesionInactividadService.cerrarSesionPorExpiracion();
      }
      return throwError(() => error);
    })
  );
};
