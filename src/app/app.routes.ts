import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'ui-kit',
    loadComponent: () =>
      import('./pages/ui-kit/ui-kit-page.component').then((m) => m.UiKitPageComponent),
  },
];
