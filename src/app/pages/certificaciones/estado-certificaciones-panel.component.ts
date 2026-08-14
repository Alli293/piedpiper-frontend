import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { LinkDirective } from '../../shared/components/link/link.directive';
import { AlertaVencimiento, UrgenciaVencimiento } from '../dashboard/dashboard.model';

export type EstadoCertificacionFiltro = 'informativa' | 'proxima_a_vencer' | 'urgente';

type TonoCertificacion = 'info' | 'warning' | 'danger';

interface TarjetaEstadoCertificacion {
  readonly estado: EstadoCertificacionFiltro;
  readonly tono: TonoCertificacion;
  readonly icon: IconName;
  readonly label: string;
  readonly value: number;
  readonly ruta: string;
  readonly queryParams: Record<string, string>;
}

const ERROR_POR_DEFECTO = 'No fue posible cargar esta sección. Intenta recargar la página.';

/**
 * Bloque "Estado de certificaciones" (PP-74): conteo de alertas de
 * vencimiento por urgencia (informativas a 90 días, próximas a vencer a 30
 * días, urgentes a 7 días o menos), usando la misma escala de colores
 * semánticos (info/warning/danger) que el Centro de Alertas y el calendario
 * de vencimientos. Todas las tarjetas enlazan al Centro de Alertas con el
 * chip de urgencia correspondiente.
 *
 * Presentacional: el fetch y el manejo de error de este bloque viven en la
 * página contenedora (mismo patrón que `ima-panel`/`benchmark-panel` en el
 * dashboard), para que una falla acá no afecte a otros bloques de la página.
 */
@Component({
  selector: 'app-estado-certificaciones-panel',
  imports: [HeadingComponent, IconComponent, LinkDirective, RouterLink],
  templateUrl: './estado-certificaciones-panel.component.html',
  styleUrl: './estado-certificaciones-panel.component.scss',
})
export class EstadoCertificacionesPanelComponent {
  readonly alertas = input<AlertaVencimiento[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly errorMensaje = computed(() => this.error() ?? ERROR_POR_DEFECTO);

  protected readonly tarjetas = computed<TarjetaEstadoCertificacion[]>(() => {
    const contar = (urgencia: UrgenciaVencimiento) =>
      this.alertas().filter((alerta) => alerta.urgencia === urgencia).length;

    return [
      {
        estado: 'informativa',
        tono: 'info',
        icon: 'info',
        label: 'Informativas',
        value: contar('90_dias'),
        ruta: '/empresa/certificaciones/alertas',
        queryParams: { filtro: 'INFORMATIVAS' },
      },
      {
        estado: 'proxima_a_vencer',
        tono: 'warning',
        icon: 'vencida',
        label: 'Próximas a vencer',
        value: contar('30_dias'),
        ruta: '/empresa/certificaciones/alertas',
        queryParams: { filtro: 'PROXIMAS' },
      },
      {
        estado: 'urgente',
        tono: 'danger',
        icon: 'danger-solido',
        label: 'Urgentes',
        value: contar('7_dias'),
        ruta: '/empresa/certificaciones/alertas',
        queryParams: { filtro: 'URGENTES' },
      },
    ];
  });
}
