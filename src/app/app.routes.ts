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
    path: 'empresa/invitaciones',
    loadComponent: () =>
      import('./pages/empresa/invitaciones/invitaciones-page.component').then(
        (m) => m.InvitacionesPageComponent
      ),
  },
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
    path: 'ui-kit',
    loadComponent: () =>
      import('./pages/ui-kit/ui-kit-page.component').then((m) => m.UiKitPageComponent),
  },
  ...rutasPostAutenticacion.map((path) => ({ path, loadComponent: cargarPlaceholder })),
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full' as const,
  },
];
