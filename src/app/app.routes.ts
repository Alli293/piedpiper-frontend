import { CanActivateFn, Routes } from '@angular/router';
import { authGuard, guardAuditorActivo, noAuthGuard, rolGuard } from './core/auth/auth.guard';

const cargarPlaceholder = () =>
  import('./pages/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent);

export const guardEmpresa: CanActivateFn = rolGuard('ADMINISTRADOR_EMPRESA', 'USUARIO_GENERAL');
export const guardEmpresaAdmin: CanActivateFn = rolGuard('ADMINISTRADOR_EMPRESA');
export const guardAuditor: CanActivateFn = rolGuard('AUDITOR_CERTIFICADO');
export const guardAdmin: CanActivateFn = rolGuard('ADMINISTRADOR_PLATAFORMA');
// El backend excluye deliberadamente al administrador de plataforma de este directorio.
export const guardDirectorioAuditores: CanActivateFn = rolGuard(
  'ADMINISTRADOR_EMPRESA',
  'USUARIO_GENERAL',
  'AUDITOR_CERTIFICADO'
);

/**
 * El detalle de una auditoría lo consultan los tres roles que participan del proceso: la empresa
 * dueña, el auditor asignado y el administrador de plataforma. El backend abre el endpoint a los
 * tres y decide por relación con la solicitud; restringir la ruta solo a la empresa dejaría al
 * auditor sin poder abrir la pantalla desde la que responde.
 *
 * Es negocio real del auditor (acepta/rechaza la auditoría, sube el reporte), así que también
 * necesita `guardAuditorActivo`: sin ella, un auditor `PENDIENTE_VALIDACION` o `RECHAZADO` podría
 * entrar por URL directa a `empresa/auditorias/:id` o `auditor/auditorias/:id` sin pasar por el
 * onboarding. `guardAuditorActivo` se ignora a sí misma para empresa/admin, así que es seguro
 * agregarla acá aunque la ruta la compartan los tres roles.
 */
export const guardDetalleAuditoria: CanActivateFn[] = [
  rolGuard('ADMINISTRADOR_EMPRESA', 'AUDITOR_CERTIFICADO', 'ADMINISTRADOR_PLATAFORMA'),
  guardAuditorActivo,
];

export const rutasPostAutenticacion = ['auditor/panel'];

const rutasPlaceholderConGuard: Record<string, CanActivateFn[]> = {
  'auditor/panel': [guardAuditor],
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
    canActivate: [guardDirectorioAuditores],
    loadComponent: () =>
      import('./pages/auditores/directorio-auditores-page.component').then(
        (m) => m.DirectorioAuditoresPageComponent
      ),
  },
  {
    path: 'auditores/:id',
    canActivate: [guardDirectorioAuditores],
    loadComponent: cargarPlaceholder,
  },
  {
    /**
     * El backend manda al administrador de plataforma a /admin/panel al iniciar sesión, y esa era
     * una pantalla placeholder sin navegación. Hasta que exista un panel propio, se lo lleva a la
     * única pantalla de administración construida en vez de a una página vacía.
     */
    path: 'admin/panel',
    redirectTo: 'admin/solicitudes-auditor',
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
    path: 'admin/solicitudes-auditor/:id',
    canActivate: [guardAdmin],
    loadComponent: () =>
      import('./pages/admin/solicitudes-auditor/detalle/revision-solicitud-auditor-page.component').then(
        (m) => m.RevisionSolicitudAuditorPageComponent
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
    canActivate: [guardAuditor, guardAuditorActivo],
    loadComponent: () =>
      import('./pages/perfil-auditor/perfil-auditor-page.component').then(
        (m) => m.PerfilAuditorPageComponent
      ),
  },
  {
    path: 'auditor/configuracion-inicial',
    canActivate: [guardAuditor],
    loadComponent: () =>
      import('./pages/auditor/configuracion-inicial/configuracion-inicial-auditor-page.component').then(
        (m) => m.ConfiguracionInicialAuditorPageComponent
      ),
  },
  {
    path: 'auditor/validacion-pendiente',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/auditor/validacion-pendiente/validacion-pendiente-auditor-page.component').then(
        (m) => m.ValidacionPendienteAuditorPageComponent
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
    path: 'empresa/metas/registrar',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/metas/registrar/registrar-meta-page.component').then(
        (m) => m.RegistrarMetaPageComponent
      ),
  },
  {
    path: 'empresa/certificaciones/listado',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/certificaciones/listado/certificaciones-listado-page.component').then(
        (m) => m.CertificacionesListadoPageComponent
      ),
  },
  {
    path: 'empresa/certificaciones/alertas',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/certificaciones/alertas/centro-alertas-page.component').then(
        (m) => m.CentroAlertasPageComponent
      ),
  },
  {
    path: 'empresa/certificaciones/:id',
    canActivate: [guardEmpresa],
    loadComponent: () =>
      import('./pages/certificaciones/detalle/certificacion-detalle-page.component').then(
        (m) => m.CertificacionDetallePageComponent
      ),
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
    path: 'ecoruta/itinerarios',
    canActivate: [usuarioIndividualGuard],
    loadComponent: cargarPlaceholder,
  },
  {
    path: 'ecoruta/itinerarios/:id',
    canActivate: [usuarioIndividualGuard],
    loadComponent: () =>
      import('./pages/ecoruta/itinerarios/itinerario-generado-page.component').then(
        (m) => m.ItinerarioGeneradoPageComponent
      ),
  },
  {
    path: 'empresas-verificadas',
    loadComponent: () =>
      import('./pages/empresas-verificadas/empresas-verificadas-page.component').then(
        (m) => m.EmpresasVerificadasPageComponent
      ),
  },
  {
    path: 'empresa/:slug/reputacion',
    loadComponent: () =>
      import('./pages/perfil-publico/perfil-publico-page.component').then(
        (m) => m.PerfilPublicoPageComponent
      ),
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
    path: 'verificar',
    loadComponent: () =>
      import('./pages/verificacion-publica/verificacion-publica-page.component').then(
        (m) => m.VerificacionPublicaPageComponent
      ),
  },
  {
    path: 'verificar/:codigo',
    loadComponent: () =>
      import('./pages/verificacion-publica/verificacion-publica-page.component').then(
        (m) => m.VerificacionPublicaPageComponent
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
    path: 'empresa/auditorias',
    canActivate: [guardEmpresaAdmin],
    loadComponent: () =>
      import('./pages/auditorias/listado/listado-auditorias-page.component').then(
        (m) => m.ListadoAuditoriasPageComponent
      ),
    data: { perspectiva: 'empresa' },
  },
  {
    path: 'auditor/auditorias',
    canActivate: [guardAuditor, guardAuditorActivo],
    loadComponent: () =>
      import('./pages/auditorias/listado/listado-auditorias-page.component').then(
        (m) => m.ListadoAuditoriasPageComponent
      ),
    data: { perspectiva: 'auditor' },
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
    path: 'empresa/auditorias/:id',
    canActivate: guardDetalleAuditoria,
    loadComponent: () =>
      import('./pages/auditorias/detalle/detalle-auditoria-page.component').then(
        (m) => m.DetalleAuditoriaPageComponent
      ),
  },
  {
    path: 'auditor/auditorias/:id',
    canActivate: guardDetalleAuditoria,
    loadComponent: () =>
      import('./pages/auditorias/detalle/detalle-auditoria-page.component').then(
        (m) => m.DetalleAuditoriaPageComponent
      ),
  },
  {
    path: 'empresa/auditorias/:id/auditor',
    canActivate: [guardEmpresaAdmin],
    loadComponent: () =>
      import('./pages/auditorias/asignar-auditor/asignar-auditor-page.component').then(
        (m) => m.AsignarAuditorPageComponent
      ),
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
    canActivate: [guardAdmin],
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
