import { Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-host',
  imports: [IconComponent],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  host: {
    class: 'ch-toast-host',
    role: 'region',
    'aria-label': 'Notificaciones del sistema',
    'aria-live': 'polite',
    'aria-atomic': 'false',
  },
})
export class ToastHostComponent {
  private readonly toastService = inject(ToastService);

  protected readonly toasts = this.toastService.toasts;

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
