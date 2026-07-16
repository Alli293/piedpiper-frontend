import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './core/auth/auth.guard';

const cargarPlaceholder = () =>
  import('./pages/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent);

export const rutasPostAutenticacion = [
  'panel',
  'empresa/panel',
  'auditor/configuracion-inicial',
  'auditor/panel',
  'auditor/validacion-pendiente',
  'perfil/configuracion-inicial',
  'admin/panel',
];

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
    path: 'registro/auditor',
    loadComponent: () =>
      import('./pages/registro-auditor/registro-auditor-page.component').then(
        (m) => m.RegistroAuditorPageComponent
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
    path: 'validacion-pendiente',
    loadComponent: () =>
      import('./pages/validacion-pendiente/validacion-pendiente-page.component').then(
        (m) => m.ValidacionPendientePageComponent
      ),
  },
  {
    path: 'limites',
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
    path: 'ui-kit',
    loadComponent: () =>
      import('./pages/ui-kit/ui-kit-page.component').then((m) => m.UiKitPageComponent),
  },
  ...rutasPostAutenticacion.map((path) => ({ path, loadComponent: cargarPlaceholder })),
  {
    path: 'emisiones/registrar',
    loadComponent: () =>
      import('./pages/emissions/register-emission/register-emission-page.component').then(
        (m) => m.RegisterEmissionPageComponent
      ),
  },
  {
    path: 'emisiones/registrar/envio',
    loadComponent: () =>
      import('./pages/emissions/register-shipping/register-shipping-page.component').then(
        (m) => m.RegisterShippingPageComponent
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
