import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './core/auth/auth.guard';

const cargarPlaceholder = () =>
  import('./pages/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent);

export const rutasPostAutenticacion = [
  'auditor/configuracion-inicial',
  'auditor/panel',
  'auditor/validacion-pendiente',
  'admin/panel',
];

const rutasPlaceholder = rutasPostAutenticacion.filter(
  (path) => path !== 'emisiones' && path !== 'emisiones/registrar'
);

export const routes: Routes = [
  {
    path: 'login',
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
    path: 'limites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/limites/limites-page.component').then((m) => m.LimitesPageComponent),
  },
  {
    path: 'admin/solicitudes-auditor',
    canActivate: [rolGuard('ADMINISTRADOR_PLATAFORMA')],
    loadComponent: () =>
      import('./pages/admin/solicitudes-auditor/solicitudes-auditor-page.component').then(
        (m) => m.SolicitudesAuditorPageComponent
      ),
  },
  {
    path: 'empresa/configuracion-inicial',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/empresa/configuracion-inicial-page.component').then(
        (m) => m.ConfiguracionInicialPageComponent
      ),
  },
  {
    path: 'empresa/invitaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/empresa/invitaciones/invitaciones-page.component').then(
        (m) => m.InvitacionesPageComponent
      ),
  },
  {
    path: 'perfil/configuracion-inicial',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/perfil/configuracion-inicial-perfil-page.component').then(
        (m) => m.ConfiguracionInicialPerfilPageComponent
      ),
  },
  {
    path: 'ui-kit',
    loadComponent: () =>
      import('./pages/ui-kit/ui-kit-page.component').then((m) => m.UiKitPageComponent),
  },
  {
    path: 'panel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'empresa/panel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'benchmark',
    canActivate: [authGuard],
    loadComponent: cargarPlaceholder,
  },
  {
    path: 'ecoruta',
    canActivate: [authGuard],
    loadComponent: cargarPlaceholder,
  },
  ...rutasPlaceholder.map((path) => ({ path, loadComponent: cargarPlaceholder })),
  {
    path: 'emisiones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/emissions/emissions-list/emissions-list-page.component').then(
        (m) => m.EmissionsListPageComponent
      ),
  },
  {
    path: 'emisiones/registrar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/emissions/register-emission/register-emission-page.component').then(
        (m) => m.RegisterEmissionPageComponent
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
    path: '',
    redirectTo: 'login',
    pathMatch: 'full' as const,
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/errors/not-found/not-found-page.component').then(
        (m) => m.NotFoundPageComponent
      ),
  },
];
