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
  readonly ruta: string;
  readonly queryParams: Record<string, string>;
}

const ERROR_POR_DEFECTO = 'No fue posible cargar esta sección. Intenta recargar la página.';

/**
 * Bloque "Estado de certificaciones" (PP-74): conteo de certificaciones
 * vigentes, próximas a vencer y vencidas de la empresa. "Vigentes" enlaza al
 * listado filtrado por ese estado; "Próximas a vencer" y "Vencidas" enlazan
 * al Centro de Alertas con el filtro de urgencia correspondiente, ya que
 * ninguna de las dos tiene un chip equivalente en el listado.
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
    const tarjetas: TarjetaEstadoCertificacion[] = [
      {
        estado: 'activa',
        tono: 'success',
        icon: 'verificar',
        label: 'Vigentes',
        value: resumen?.activas ?? 0,
        ruta: '/empresa/certificaciones/listado',
        queryParams: { estado: 'activa' },
      },
      {
        estado: 'proxima_a_vencer',
        tono: 'warning',
        icon: 'vencida',
        label: 'Próximas a vencer',
        value: resumen?.proximasAVencer ?? 0,
        ruta: '/empresa/certificaciones/alertas',
        queryParams: { filtro: 'PROXIMAS' },
      },
      {
        estado: 'vencida',
        tono: 'danger',
        icon: 'danger-solido',
        label: resumen?.vencidas === 1 ? 'Vencida' : 'Vencidas',
        value: resumen?.vencidas ?? 0,
        ruta: '/empresa/certificaciones/alertas',
        queryParams: { filtro: 'VENCIDAS' },
      },
    ];
    return tarjetas;
  });
}
