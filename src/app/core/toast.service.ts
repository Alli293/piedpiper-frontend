import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal('');
  private timeoutId: number | null = null;

  show(message: string, durationMs = 5000): void {
    this.message.set(message);

    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.message.set('');
      this.timeoutId = null;
    }, durationMs);
  }
}
