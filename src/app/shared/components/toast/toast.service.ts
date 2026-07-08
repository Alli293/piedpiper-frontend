import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'error', duration = 5000): void {
    const id = this.nextId++;
    this.toasts.update((current) => [...current, { id, message, type }]);

    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
