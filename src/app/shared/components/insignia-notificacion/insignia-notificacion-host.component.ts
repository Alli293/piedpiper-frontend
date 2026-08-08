import { Component, computed, inject } from '@angular/core';
import { InsigniaNotificacionService } from '../../../core/services/insignia-notificacion.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-insignia-notificacion-host',
  imports: [IconComponent],
  templateUrl: './insignia-notificacion-host.component.html',
  styleUrl: './insignia-notificacion-host.component.scss',
  host: {
    class: 'ch-insignia-notificacion-host',
    role: 'status',
    'aria-live': 'polite',
  },
})
export class InsigniaNotificacionHostComponent {
  private readonly service = inject(InsigniaNotificacionService);

  protected readonly actual = computed(() => this.service.pendientes()[0] ?? null);

  protected cerrar(): void {
    this.service.descartarActual();
  }
}
