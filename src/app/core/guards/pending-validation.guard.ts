import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Functional guard that prevents navigation to protected routes
 * if the user's estado is 'pendiente_validacion'.
 *
 * It checks the user state from localStorage (set during login/auth flow).
 * If the user is pending validation, redirects to /validacion-pendiente.
 *
 * Validates: Requirements 7.1, 7.2
 */
export const pendingValidationGuard: CanActivateFn = () => {
  const router = inject(Router);

  const userDataRaw = localStorage.getItem('user');
  if (!userDataRaw) {
    // No user data - allow navigation (auth guard handles no-auth separately)
    return true;
  }

  try {
    const user = JSON.parse(userDataRaw);
    if (user.estado === 'pendiente_validacion') {
      return router.createUrlTree(['/validacion-pendiente']);
    }
  } catch {
    // Invalid data, allow navigation
  }

  return true;
};
