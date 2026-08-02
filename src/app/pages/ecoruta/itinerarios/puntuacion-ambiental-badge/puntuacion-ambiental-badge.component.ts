import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PuntuacionAmbientalResponse } from '../models/puntuacion-ambiental.model';

@Component({
  selector: 'app-puntuacion-ambiental-badge',
  imports: [IconComponent, DecimalPipe],
  template: `
    @if (puntuacion()) {
      <span
        class="ch-puntuacion-badge"
        [class]="badgeClass()"
        [attr.aria-label]="'Puntuación ambiental: ' + (puntuacion()!.puntuacionTotal | number: '1.0-0') + ' de 100'"
      >
        <app-icon name="hoja" [size]="14" aria-hidden="true" />
        <span class="ch-puntuacion-badge__valor" aria-hidden="true">{{
          puntuacion()!.puntuacionTotal | number: '1.0-0'
        }}</span>
        <span class="ch-puntuacion-badge__max" aria-hidden="true">/100</span>
      </span>
    }
  `,
  styleUrl: './puntuacion-ambiental-badge.component.scss',
})
export class PuntuacionAmbientalBadgeComponent {
  puntuacion = input<PuntuacionAmbientalResponse | null>(null);

  protected readonly badgeClass = computed(() => {
    const p = this.puntuacion();
    if (!p) return '';
    const total = p.puntuacionTotal ?? 0;
    if (total >= 70) return 'ch-puntuacion-badge--alto';
    if (total >= 40) return 'ch-puntuacion-badge--medio';
    return 'ch-puntuacion-badge--bajo';
  });
}
