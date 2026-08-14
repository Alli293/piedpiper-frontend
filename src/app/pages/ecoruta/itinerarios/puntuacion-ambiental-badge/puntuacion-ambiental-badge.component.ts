import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { PuntuacionAmbientalResponse } from '../models/puntuacion-ambiental.model';

@Component({
  selector: 'app-puntuacion-ambiental-badge',
  imports: [IconComponent, DecimalPipe],
  templateUrl: './puntuacion-ambiental-badge.component.html',
  styleUrl: './puntuacion-ambiental-badge.component.scss',
})
export class PuntuacionAmbientalBadgeComponent {
  puntuacion = input<PuntuacionAmbientalResponse | null>(null);
  puntuacionEstimada = input<number | null>(null);

  protected readonly valorMostrado = computed(
    () => this.puntuacion()?.puntuacionTotal ?? this.puntuacionEstimada() ?? null
  );

  protected readonly badgeClass = computed(() => {
    const total = this.valorMostrado();
    if (total === null) return '';
    if (total >= 70) return 'ch-puntuacion-badge--alto';
    if (total >= 40) return 'ch-puntuacion-badge--medio';
    return 'ch-puntuacion-badge--bajo';
  });
}
