import { Component, input } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CertificacionActiva } from '../models/puntuacion-ambiental.model';

@Component({
  selector: 'app-certificaciones-detalle',
  imports: [IconComponent],
  templateUrl: './certificaciones-detalle.component.html',
  styleUrl: './certificaciones-detalle.component.scss',
})
export class CertificacionesDetalleComponent {
  certificaciones = input<CertificacionActiva[]>([]);

  protected formatFecha(fecha: string): string {
    // Parsear como fecha local para evitar desplazamiento por zona horaria
    // cuando el backend devuelve LocalDate (YYYY-MM-DD sin timezone)
    const [year, month, day] = fecha.split(/[-T]/);
    const local = new Date(+year, +month - 1, +day);
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(local);
  }
}
