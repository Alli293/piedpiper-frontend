import { Routes } from '@angular/router';

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
    path: 'registro/:rol',
    loadComponent: () =>
      import('./pages/auth/registro/registro-rol-page.component').then(
        (m) => m.RegistroRolPageComponent
      ),
  },
  {
    path: 'registro-auditor',
    loadComponent: () =>
      import('./pages/registro-auditor/registro-auditor-page.component').then(
        (m) => m.RegistroAuditorPageComponent,
      ),
  },
  {
    path: 'confirmacion-registro',
    loadComponent: () =>
      import('./pages/confirmacion-registro/confirmacion-registro-page.component').then(
        (m) => m.ConfirmacionRegistroPageComponent,
      ),
  },
  {
    path: 'verificar-email',
    loadComponent: () =>
      import('./pages/verificacion-email/verificacion-email-page.component').then(
        (m) => m.VerificacionEmailPageComponent,
      ),
  },
  {
    path: 'validacion-pendiente',
    loadComponent: () =>
      import('./pages/validacion-pendiente/validacion-pendiente-page.component').then(
        (m) => m.ValidacionPendientePageComponent,
      ),
  },
  {
    path: 'ui-kit',
    loadComponent: () =>
      import('./pages/ui-kit/ui-kit-page.component').then((m) => m.UiKitPageComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
