import { Injectable, signal } from '@angular/core';

export type TipoToast = 'error' | 'exito';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: TipoToast;
}

const DURACION_MS = 5000;

let siguienteId = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsActivos = signal<Toast[]>([]);

  readonly toasts = this.toastsActivos.asReadonly();

  error(mensaje: string): void {
    this.mostrar(mensaje, 'error');
  }

  exito(mensaje: string): void {
    this.mostrar(mensaje, 'exito');
  }

  cerrar(id: number): void {
    this.toastsActivos.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private mostrar(mensaje: string, tipo: TipoToast): void {
    const toast: Toast = { id: siguienteId++, mensaje, tipo };
    this.toastsActivos.update((toasts) => [...toasts, toast]);
    setTimeout(() => this.cerrar(toast.id), DURACION_MS);
  }
}
