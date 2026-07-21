import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.token()) {
    return true;
  }

  return router.parseUrl('/login');
};

export const rolGuard = (...rolesPermitidos: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.token()) {
      return router.parseUrl('/login');
    }

    if (rolesPermitidos.includes(authService.rol() ?? '')) {
      return true;
    }

    return router.parseUrl('/');
  };
};
