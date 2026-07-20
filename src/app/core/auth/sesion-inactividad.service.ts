import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';

const INACTIVIDAD_MS = 30 * 60 * 1000;
const MENSAJE_EXPIRACION = 'Tu sesión expiró. Inicia sesión nuevamente.';

@Injectable({ providedIn: 'root' })
export class SesionInactividadService {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private timerId: ReturnType<typeof setTimeout> | undefined;

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

  private expirarPorInactividad(): void {
    this.timerId = undefined;
    this.authService.cerrarSesion();
    this.toastService.error(MENSAJE_EXPIRACION);
    void this.router.navigateByUrl('/login');
  }
}
