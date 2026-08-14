import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { esUrlDelBackend } from '../http/backend-url.util';
import { AuthService } from './auth.service';
import { SesionInactividadService } from './sesion-inactividad.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (!esUrlDelBackend(req.url)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.token();

  if (!token) {
    return next(req);
  }

  inject(SesionInactividadService).reiniciar();

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
