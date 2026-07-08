import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="ch-toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="ch-toast ch-toast--{{ toast.type }}" role="alert">
          <span class="ch-toast__message">{{ toast.message }}</span>
          <button
            class="ch-toast__close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  protected toastService = inject(ToastService);
}
