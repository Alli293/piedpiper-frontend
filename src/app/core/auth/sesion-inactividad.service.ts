import { Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';

const INACTIVIDAD_MS = 30 * 60 * 1000;
export const MENSAJE_SESION_EXPIRADA = 'Tu sesión expiró. Inicia sesión nuevamente.';

@Injectable({ providedIn: 'root' })
export class SesionInactividadService {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private timerId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      if (this.authService.token()) {
        this.reiniciar();
      } else {
        this.detener();
      }
    });
  }

  reiniciar(): void {
    this.detener();
    this.timerId = setTimeout(() => this.expirarPorInactividad(), INACTIVIDAD_MS);
  }

  detener(): void {
    if (this.timerId !== undefined) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
  }

  /** Cierra la sesión por expiración (inactividad o 401 del backend), avisa y redirige. */
  cerrarSesionPorExpiracion(): void {
    this.detener();
    this.authService.cerrarSesion();
    this.toastService.error(MENSAJE_SESION_EXPIRADA);
    void this.router.navigateByUrl('/login');
  }

  private expirarPorInactividad(): void {
    this.timerId = undefined;
    this.cerrarSesionPorExpiracion();
  }
}
