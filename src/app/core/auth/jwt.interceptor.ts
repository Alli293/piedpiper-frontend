import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SesionInactividadService } from './sesion-inactividad.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (!perteneceAlBackend(req.url)) {
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

function perteneceAlBackend(url: string): boolean {
  const origenActual = window.location.origin;
  const api = new URL(environment.apiBaseUrl, origenActual);
  const destino = new URL(url, origenActual);
  const rutaApi = api.pathname.replace(/\/$/, '');

  return (
    destino.origin === api.origin &&
    (destino.pathname === rutaApi || destino.pathname.startsWith(`${rutaApi}/`))
  );
}
