import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Functional guard that prevents navigation to authenticated-only routes
 * if the user does not have a valid token stored.
 * Redirects to /login if unauthenticated.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token();
  if (!token) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
