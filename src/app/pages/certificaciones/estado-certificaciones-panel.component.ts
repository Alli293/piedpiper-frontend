import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { LinkDirective } from '../../shared/components/link/link.directive';
import { ResumenCertificacionesDashboardResponse } from '../dashboard/dashboard.model';

export type EstadoCertificacionFiltro = 'activa' | 'proxima_a_vencer' | 'vencida';

type TonoCertificacion = 'success' | 'warning' | 'danger';

interface TarjetaEstadoCertificacion {
  readonly estado: EstadoCertificacionFiltro;
  readonly tono: TonoCertificacion;
  readonly icon: IconName;
  readonly label: string;
  readonly value: number;
}

const ERROR_POR_DEFECTO = 'No fue posible cargar esta sección. Intenta recargar la página.';

/**
 * Bloque "Estado de certificaciones" (PP-74): conteo de certificaciones
 * activas, próximas a vencer y vencidas de la empresa, cada una con acceso
 * directo al listado filtrado por ese estado.
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
  readonly resumen = input<ResumenCertificacionesDashboardResponse | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly errorMensaje = computed(() => this.error() ?? ERROR_POR_DEFECTO);

  protected readonly tarjetas = computed<TarjetaEstadoCertificacion[]>(() => {
    const resumen = this.resumen();
    return [
      {
        estado: 'activa',
        tono: 'success',
        icon: 'success',
        label: 'Activas',
        value: resumen?.activas ?? 0,
      },
      {
        estado: 'proxima_a_vencer',
        tono: 'warning',
        icon: 'warning',
        label: 'Próximas a vencer',
        value: resumen?.proximasAVencer ?? 0,
      },
      {
        estado: 'vencida',
        tono: 'danger',
        icon: 'error',
        label: resumen?.vencidas === 1 ? 'Vencida' : 'Vencidas',
        value: resumen?.vencidas ?? 0,
      },
    ];
  });
}
