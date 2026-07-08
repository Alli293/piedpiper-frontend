import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

/**
 * Functional HTTP interceptor that detects 403 responses with
 * `pendiente_validacion` in the body and redirects to /validacion-pendiente.
 *
 * Validates: Requirements 7.1, 7.2
 */
export const pendingValidationInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    tap({
      error: (error) => {
        if (
          error?.status === 403 &&
          error?.error &&
          (error.error.estado === 'pendiente_validacion' ||
            error.error.mensaje?.includes('pendiente_validacion') ||
            JSON.stringify(error.error).includes('pendiente_validacion'))
        ) {
          router.navigate(['/validacion-pendiente']);
        }
      },
    })
  );
};
