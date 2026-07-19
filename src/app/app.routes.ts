import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

const cargarDashboard = () =>
  import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent);

const cargarPlaceholder = () =>
  import('./pages/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent);

export const rutasPostAutenticacion = [
  'panel',
  'empresa/panel',
  'auditor/configuracion-inicial',
  'auditor/panel',
  'auditor/validacion-pendiente',
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
    path: 'empresa/configuracion-inicial',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/empresa/configuracion-inicial-page.component').then(
        (m) => m.ConfiguracionInicialPageComponent
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
  // Dashboard de empresa: el backend redirige a /empresa/panel (admin) o /panel (usuario general).
  {
    path: 'panel',
    canActivate: [authGuard],
    loadComponent: cargarDashboard,
  },
  {
    path: 'empresa/panel',
    canActivate: [authGuard],
    loadComponent: cargarDashboard,
  },
  ...rutasPostAutenticacion
    .filter((path) => path !== 'panel' && path !== 'empresa/panel')
    .map((path) => ({ path, loadComponent: cargarPlaceholder })),
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
