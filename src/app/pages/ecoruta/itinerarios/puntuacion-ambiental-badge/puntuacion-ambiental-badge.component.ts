import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PuntuacionAmbientalResponse } from '../models/puntuacion-ambiental.model';

@Component({
  selector: 'app-puntuacion-ambiental-badge',
  imports: [IconComponent, DecimalPipe],
  template: `
    @if (puntuacion()) {
      <span class="ch-puntuacion-badge" [class]="badgeClass()">
        <app-icon name="hoja" [size]="14" aria-hidden="true" />
        <span class="ch-puntuacion-badge__valor">{{
          puntuacion()!.puntuacionTotal | number: '1.0-0'
        }}</span>
      </span>
    }
  `,
  styleUrl: './puntuacion-ambiental-badge.component.scss',
})
export class PuntuacionAmbientalBadgeComponent {
  puntuacion = input<PuntuacionAmbientalResponse | null>(null);

  protected readonly badgeClass = computed(() => {
    const total = this.puntuacion()?.puntuacionTotal ?? 0;
    if (total >= 70) return 'ch-puntuacion-badge--alto';
    if (total >= 40) return 'ch-puntuacion-badge--medio';
    return 'ch-puntuacion-badge--bajo';
  });
}
