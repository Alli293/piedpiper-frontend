import { Component, input } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CertificacionActiva } from '../models/puntuacion-ambiental.model';

@Component({
  selector: 'app-certificaciones-detalle',
  imports: [IconComponent],
  template: `
    @if (certificaciones() && certificaciones()!.length > 0) {
      <details class="ch-cert-detalle">
        <summary class="ch-cert-detalle__summary">
          <app-icon name="certificaciones" [size]="14" aria-hidden="true" />
          {{ certificaciones()!.length }} certificación(es) activa(s)
        </summary>
        <ul class="ch-cert-detalle__lista">
          @for (cert of certificaciones()!; track cert.id) {
            <li class="ch-cert-detalle__item">
              <span class="ch-cert-detalle__nombre">{{ cert.nombre }}</span>
              <span class="ch-cert-detalle__fecha">{{ formatFecha(cert.fechaEmision) }}</span>
            </li>
          }
        </ul>
      </details>
    }
  `,
  styleUrl: './certificaciones-detalle.component.scss',
})
export class CertificacionesDetalleComponent {
  certificaciones = input<CertificacionActiva[]>([]);

  protected formatFecha(fecha: string): string {
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(fecha));
  }
}
