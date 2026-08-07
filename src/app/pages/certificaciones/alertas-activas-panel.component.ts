import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AlertaVencimiento, UrgenciaVencimiento } from '../dashboard/dashboard.model';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { LinkDirective } from '../../shared/components/link/link.directive';

const ERROR_POR_DEFECTO = 'No fue posible cargar esta sección. Intenta recargar la página.';
const SIN_ALERTAS_MENSAJE = 'No hay alertas activas en este momento.';

type TonoAlerta = 'danger' | 'warning';

const TONO_POR_URGENCIA: Record<UrgenciaVencimiento, TonoAlerta> = {
  vencida: 'danger',
  '7_dias': 'danger',
  '30_dias': 'warning',
  '90_dias': 'warning',
};

const ICONO_POR_TONO: Record<TonoAlerta, IconName> = {
  danger: 'error',
  warning: 'warning',
};

/**
 * Bloque "Alertas activas" (PP-76): certificaciones vencidas o próximas a
 * vencer de la empresa, ordenadas de más a menos urgente, con acceso
 * directo a la vista de detalle de cada certificación.
 *
 * Presentacional: el fetch y el manejo de error viven en la página
 * contenedora (mismo patrón que `estado-certificaciones-panel` /
 * `calendario-vencimientos` / `insignias-empresa-panel`), para que una
 * falla acá no afecte a los demás bloques del dashboard de Certificaciones.
 */
@Component({
  selector: 'app-alertas-activas-panel',
  imports: [DatePipe, HeadingComponent, IconComponent, LinkDirective, RouterLink],
  templateUrl: './alertas-activas-panel.component.html',
  styleUrl: './alertas-activas-panel.component.scss',
})
export class AlertasActivasPanelComponent {
  readonly alertas = input<AlertaVencimiento[] | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly sinAlertasMensaje = SIN_ALERTAS_MENSAJE;
  protected readonly errorMensaje = computed(() => this.error() ?? ERROR_POR_DEFECTO);

  protected readonly alertasOrdenadas = computed(() =>
    [...(this.alertas() ?? [])].sort((a, b) => a.diasRestantes - b.diasRestantes)
  );

  protected estaVencida(alerta: AlertaVencimiento): boolean {
    return alerta.urgencia === 'vencida';
  }

  protected tono(alerta: AlertaVencimiento): TonoAlerta {
    return TONO_POR_URGENCIA[alerta.urgencia];
  }

  protected icono(alerta: AlertaVencimiento): IconName {
    return ICONO_POR_TONO[this.tono(alerta)];
  }
}
