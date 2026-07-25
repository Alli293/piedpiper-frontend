import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario, RUTA_INICIO_POR_ROL } from '../models/perfil-inicial.model';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.token()) {
    return true;
  }

  return router.parseUrl('/login');
};

export const rolGuard = (...rolesPermitidos: RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const rol = authService.rol();

    if (!authService.token() || !rol) {
      return router.parseUrl('/login');
    }

    if (rolesPermitidos.includes(rol as RolUsuario)) {
      return true;
    }

    // Sesión válida pero rol sin acceso a esta ruta: se envía a su propia
    // pantalla de inicio en lugar de a login, para no dar la falsa impresión
    // de que la sesión se cerró.
    const rutaInicio = esRolConocido(rol) ? RUTA_INICIO_POR_ROL[rol] : '/login';
    return router.parseUrl(rutaInicio);
  };
};

const esRolConocido = (rol: string): rol is RolUsuario => rol in RUTA_INICIO_POR_ROL;
