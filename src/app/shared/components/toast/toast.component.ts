import { Component, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  imports: [IconComponent],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  host: {
    class: 'ch-toast-container',
  },
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);
}
