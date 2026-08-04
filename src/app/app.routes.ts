import { CanActivateFn, Routes } from '@angular/router';
import { authGuard, noAuthGuard, rolGuard } from './core/auth/auth.guard';

const cargarPlaceholder = () =>
  import('./pages/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent);

export const guardEmpresa: CanActivateFn = rolGuard('ADMINISTRADOR_EMPRESA', 'USUARIO_GENERAL');
export const guardEmpresaAdmin: CanActivateFn = rolGuard('ADMINISTRADOR_EMPRESA');
export const guardAuditor: CanActivateFn = rolGuard('AUDITOR_CERTIFICADO');
export const guardAdmin: CanActivateFn = rolGuard('ADMINISTRADOR_PLATAFORMA');

export const rutasPostAutenticacion = [
  'auditor/configuracion-inicial',
  'auditor/panel',
  'auditor/validacion-pendiente',
  'admin/panel',
];

const rutasPlaceholderConGuard: Record<string, CanActivateFn[]> = {
  'auditor/configuracion-inicial': [guardAuditor],
  'auditor/panel': [guardAuditor],
  'auditor/validacion-pendiente': [authGuard],
  'admin/panel': [guardAdmin],
};

const rutasPlaceholder = rutasPostAutenticacion.map((path) => ({
  path,
  canActivate: rutasPlaceholderConGuard[path],
  loadComponent: cargarPlaceholder,
}));

export const usuarioIndividualGuard = rolGuard('USUARIO_INDIVIDUAL');

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full' as const,
    loadComponent: () =>
      import('./pages/landing/landing-page.component').then((m) => m.LandingPageComponent),
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./pages/auth/login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/auth/bienvenida/bienvenida-page.component').then(
        (m) => m.BienvenidaPageComponent
      ),
  },
  {
    path: 'registro/invitacion',
    loadComponent: () =>
      import('./pages/auth/registro-invitacion/registro-invitacion-page.component').then(
        (m) => m.RegistroInvitacionPageComponent
      ),
  },
  {
    path: 'registro/:rol',
    loadComponent: () =>
      import('./pages/auth/registro/registro-rol-page.component').then(
        (m) => m.RegistroRolPageComponent
      ),
  },
  {
    path: 'recuperar-contrasena',
    loadComponent: () =>
      import('./pages/auth/recuperar-contrasena/recuperar-contrasena-page.component').then(
        (m) => m.RecuperarContrasenaPageComponent
      ),
  },
  {
    path: 'reset-contrasena',
    loadComponent: () =>
      import('./pages/auth/reset-contrasena/reset-contrasena-page.component').then(
        (m) => m.ResetContrasenaPageComponent
      ),
  },
  {
    path: 'verificar-correo',
    loadComponent: () =>
      import('./pages/auth/verificar-correo/verificar-correo-page.component').then(
        (m) => m.VerificarCorreoPageComponent
      ),
  },
  {
    path: 'validacion-pendiente',
    loadComponent: () =>
      import('./pages/validacion-pendiente/validacion-pendiente-page.component').then(
        (m) => m.ValidacionPendientePageComponent
      ),
  },
  {
    path: 'auditores',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/auditores/directorio-auditores-page.component').then(
        (m) => m.DirectorioAuditoresPageComponent
      ),
  },
  {
    path: 'auditores/:id',
    canActivate: [authGuard],
    loadComponent: cargarPlaceholder,
  },
  {
    path: 'admin/solicitudes-auditor',
    canActivate: [guardAdmin],
    loadComponent: () =>
      import('./pages/admin/solicitudes-auditor/solicitudes-auditor-page.component').then(
        (m) => m.SolicitudesAuditorPageComponent
      ),
  },
  {
    path: 'ecoruta/preferencias',
    canActivate: [usuarioIndividualGuard],
    loadComponent: () =>
      import('./pages/ecoruta/preferencias/ecoruta-preferencias-page.component').then(
        (m) => m.EcoRutaPreferenciasPageComponent
      ),
  },
  {
    path: 'auditor/perfil',
    canActivate: [rolGuard('AUDITOR_CERTIFICADO')],
    loadComponent: () =>
      import('./pages/perfil-auditor/perfil-auditor-page.component').then(
        (m) => m.PerfilAuditorPageComponent
      ),
  },
  {
    path: 'empresa/configuracion-inicial',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/empresa/configuracion-inicial-page.component').then(
        (m) => m.ConfiguracionInicialPageComponent
      ),
  },
  {
    path: 'empresa/invitaciones',
    canActivate: [guardEmpresaAdmin],
    loadComponent: () =>
      import('./pages/empresa/invitaciones/invitaciones-page.component').then(
        (m) => m.InvitacionesPageComponent
      ),
  },
  {
    path: 'empresa/panel',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'empresa/benchmark',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/madurez-ambiental/madurez-ambiental-page.component').then(
        (m) => m.MadurezAmbientalPageComponent
      ),
  },
  {
    path: 'empresa/certificaciones',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/certificaciones/certificaciones-page.component').then(
        (m) => m.CertificacionesPageComponent
      ),
  },
  {
    path: 'empresa/insignias',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/empresa/insignias/insignias-empresa-page.component').then(
        (m) => m.InsigniasEmpresaPageComponent
      ),
  },
  {
    path: 'empresa/limites',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/limites/limites-page.component').then((m) => m.LimitesPageComponent),
  },
  {
    path: 'madurez-ambiental',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/madurez-ambiental/madurez-ambiental-page.component').then(
        (m) => m.MadurezAmbientalPageComponent
      ),
  },
  {
    path: 'ecoruta',
    canActivate: [usuarioIndividualGuard],
    loadComponent: cargarPlaceholder,
  },
  {
    path: 'ecoruta/insignias',
    canActivate: [usuarioIndividualGuard],
    loadComponent: () =>
      import('./pages/ecoruta/insignias/insignias-ecoruta-page.component').then(
        (m) => m.InsigniasEcoRutaPageComponent
      ),
  },
  {
    path: 'ecoruta/planificar',
    canActivate: [usuarioIndividualGuard],
    loadComponent: cargarPlaceholder,
  },
  {
    path: 'ecoruta/itinerarios',
    canActivate: [usuarioIndividualGuard],
    loadComponent: cargarPlaceholder,
  },
  {
    path: 'empresa/:slug/reputacion/certificaciones',
    loadComponent: () =>
      import('./pages/perfil-publico/certificaciones/certificaciones-publicas-page.component').then(
        (m) => m.CertificacionesPublicasPageComponent
      ),
  },
  {
    path: 'empresa/:slug/reputacion/insignias',
    loadComponent: () =>
      import('./pages/perfil-publico/insignias/insignias-publicas-page.component').then(
        (m) => m.InsigniasPublicasPageComponent
      ),
  },
  {
    path: 'empresa/emisiones',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/emissions/emissions-list/emissions-list-page.component').then(
        (m) => m.EmissionsListPageComponent
      ),
  },
  {
    path: 'empresa/emisiones/registrar',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/emissions/register-emission/register-emission-page.component').then(
        (m) => m.RegisterEmissionPageComponent
      ),
  },
  {
    path: 'empresa/auditorias/nueva',
    canActivate: [guardEmpresaAdmin],
    loadComponent: () =>
      import('./pages/auditorias/nueva-solicitud/nueva-solicitud-page.component').then(
        (m) => m.NuevaSolicitudPageComponent
      ),
  },
  {
    // Pantalla de asignación de auditor (PP-45): placeholder hasta que exista la página real.
    path: 'empresa/auditorias/:id/auditor',
    canActivate: [guardEmpresaAdmin],
    loadComponent: cargarPlaceholder,
  },
  ...rutasPlaceholder,
  {
    path: 'perfil/configuracion-inicial',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/perfil/configuracion-inicial-perfil-page.component').then(
        (m) => m.ConfiguracionInicialPerfilPageComponent
      ),
  },
  {
    path: 'configuracion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/configuracion/configuracion-page.component').then(
        (m) => m.ConfiguracionPageComponent
      ),
  },
  {
    path: 'ui-kit',
    loadComponent: () =>
      import('./pages/ui-kit/ui-kit-page.component').then((m) => m.UiKitPageComponent),
  },
  {
    path: 'panel',
    redirectTo: 'empresa/panel',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/errors/not-found/not-found-page.component').then(
        (m) => m.NotFoundPageComponent
      ),
  },
];
