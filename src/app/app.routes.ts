import { Routes } from '@angular/router';

const cargarPlaceholder = () =>
  import('./pages/placeholder/placeholder-page.component').then((m) => m.PlaceholderPageComponent);

export const rutasPostAutenticacion = [
  'panel',
  'empresa/configuracion-inicial',
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
    path: 'emisiones/registrar',
    loadComponent: () =>
      import('./pages/emissions/register-emission/register-emission-page.component').then(
        (m) => m.RegisterEmissionPageComponent
      ),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full' as const,
  },
];
