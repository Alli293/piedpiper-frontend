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

// Evita que una sesión ya iniciada vuelva a ver el login (bookmark, botón
// atrás, enlace viejo): se redirige a su pantalla de inicio en vez de
// cerrarle la sesión, para no destruir un token todavía válido.
export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const rol = authService.rol();

  if (!authService.token()) {
    return true;
  }

  const rutaInicio = rol && esRolConocido(rol) ? RUTA_INICIO_POR_ROL[rol] : '/';
  return router.parseUrl(rutaInicio);
};

export const rolGuard = (...rolesPermitidos: RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const rol = authService.rol();

    if (!authService.token() || !rol) {
      return router.parseUrl('/login');
    }

    if (rolesPermitidos.includes(rol)) {
      return true;
    }

    // Sesión válida pero rol sin acceso a esta ruta: se envía a su propia
    // pantalla de inicio en lugar de a login, para no dar la falsa impresión
    // de que la sesión se cerró.
    const rutaInicio = esRolConocido(rol) ? RUTA_INICIO_POR_ROL[rol] : '/login';
    return router.parseUrl(rutaInicio);
  };
};

/**
 * Complemento de `guardAuditor`: el rol viaja en el JWT apenas se registra el auditor, antes de
 * que el administrador lo apruebe, así que un auditor `PENDIENTE_VALIDACION` pasa `rolGuard` sin
 * problema. Esta guarda cierra esa ventana en las pantallas de negocio real (auditorías
 * asignadas, perfil público) mandándolo a la pantalla que le corresponde según en qué paso de su
 * propio onboarding esté — la misma decisión que ya toma `RedirectResolver` en el backend al
 * iniciar sesión, aplicada de nuevo acá para cuando entra por una URL directa en vez de por login.
 *
 * Con configuración completa, todo estado no-`ACTIVO` (`PENDIENTE_VALIDACION` o `RECHAZADO`) cae
 * en `/auditor/validacion-pendiente`: esa pantalla lee el estado real de la solicitud y muestra
 * el rechazo (con motivo) en vez de repetir el mensaje de "en revisión".
 *
 * Se ignora a sí misma cuando el rol activo no es `AUDITOR_CERTIFICADO`, para poder componerse
 * con guardas que ya comparten ruta entre varios roles (`guardDetalleAuditoria`) sin rebotar a la
 * empresa o al administrador de plataforma hacia pantallas de onboarding de auditor que no les
 * corresponden.
 */
export const guardAuditorActivo: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.rol() !== 'AUDITOR_CERTIFICADO' || authService.estado() === 'ACTIVO') {
    return true;
  }

  return router.parseUrl(
    authService.configuracionCompleta()
      ? '/auditor/validacion-pendiente'
      : '/auditor/configuracion-inicial'
  );
};

const esRolConocido = (rol: string): rol is RolUsuario => rol in RUTA_INICIO_POR_ROL;
