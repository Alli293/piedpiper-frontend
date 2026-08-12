import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CertificacionResumen } from '../../core/models/certificacion.model';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LinkDirective } from '../../shared/components/link/link.directive';

const ERROR_POR_DEFECTO = 'No fue posible cargar esta sección. Intenta recargar la página.';
const SIN_CERTIFICACIONES_MENSAJE =
  'Aún no tienes certificaciones registradas. Cuando tu empresa emita una, aparecerá aquí.';

/**
 * Bloque "Certificaciones recientes": certificaciones de la empresa
 * ordenadas por fecha de emisión descendente, con acceso directo al
 * detalle de cada una. Reemplaza al bloque "Alertas activas" del
 * dashboard — las alertas de vencimiento ya son accesibles desde las
 * tarjetas de "Estado de certificaciones" y el Centro de Alertas.
 *
 * Presentacional: el fetch y el manejo de error viven en la página
 * contenedora (mismo patrón que `insignias-empresa-panel`).
 */
@Component({
  selector: 'app-certificaciones-recientes-panel',
  imports: [BadgeComponent, DatePipe, HeadingComponent, IconComponent, LinkDirective, RouterLink],
  templateUrl: './certificaciones-recientes-panel.component.html',
  styleUrl: './certificaciones-recientes-panel.component.scss',
})
export class CertificacionesRecientesPanelComponent {
  readonly certificaciones = input<CertificacionResumen[] | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly sinCertificacionesMensaje = SIN_CERTIFICACIONES_MENSAJE;
  protected readonly errorMensaje = computed(() => this.error() ?? ERROR_POR_DEFECTO);

  protected readonly certificacionesOrdenadas = computed(() =>
    [...(this.certificaciones() ?? [])].sort(
      (a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()
    )
  );

  protected etiquetaVigencia(cert: CertificacionResumen): string {
    return cert.vigente ? 'Vigente' : 'Vencida';
  }

  protected varianteVigencia(cert: CertificacionResumen): BadgeVariant {
    return cert.vigente ? 'success' : 'warning';
  }
}
