import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { RecomendacionRenovacion } from '../dashboard/dashboard.model';

const MENSAJE_NO_DISPONIBLE =
  'No fue posible generar la recomendación en este momento. Intenta recargar la página.';

/**
 * "Recomendación de renovación" (PP-72): certificación con alerta activa
 * que debe renovarse primero, con justificación redactada por IA.
 *
 * A diferencia de los demás bloques del dashboard de Certificaciones, este
 * NO se muestra si no hay recomendación (empresa sin certificaciones con
 * alerta activa) — la página contenedora decide si instanciarlo o no,
 * envolviéndolo en `@if`.
 *
 * El fetch vive en `certificaciones-page`, mismo patrón que los demás
 * bloques: una falla acá no afecta al resto de la página.
 */
@Component({
  selector: 'app-recomendacion-renovacion-panel',
  imports: [ButtonComponent, HeadingComponent, IconComponent, RouterLink],
  templateUrl: './recomendacion-renovacion-panel.component.html',
  styleUrl: './recomendacion-renovacion-panel.component.scss',
})
export class RecomendacionRenovacionPanelComponent {
  readonly recomendacion = input<RecomendacionRenovacion | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly mensajeNoDisponible = MENSAJE_NO_DISPONIBLE;

  protected readonly justificacionCompleta = computed(() => {
    const r = this.recomendacion();
    if (!r || !r.justificacion) return null;
    return r.sugerenciaAccion ? `${r.justificacion} ${r.sugerenciaAccion}` : r.justificacion;
  });
}
