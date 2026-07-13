import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error';

export interface ToastMessage {
  readonly id: number;
  readonly variant: ToastVariant;
  readonly title: string;
  readonly description?: string;
}

const DEFAULT_DURATION_MS = 8000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 0;

  show(toast: Omit<ToastMessage, 'id'>, durationMs = DEFAULT_DURATION_MS): void {
    const id = this.nextId++;
    this._toasts.update((toasts) => [...toasts, { ...toast, id }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(title: string, description?: string, durationMs?: number): void {
    this.show({ variant: 'success', title, description }, durationMs);
  }

  error(title: string, description?: string, durationMs?: number): void {
    this.show({ variant: 'error', title, description }, durationMs);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
