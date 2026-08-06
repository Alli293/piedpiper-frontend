import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InsigniaEmpresa, NivelInsigniaEmpresa } from '../../core/empresa/empresa.models';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LinkDirective } from '../../shared/components/link/link.directive';

const ERROR_POR_DEFECTO = 'No fue posible cargar esta sección. Intenta recargar la página.';
const SIN_INSIGNIAS_MENSAJE =
  'Aún no has obtenido insignias. Completa tus certificaciones para comenzar.';

const NIVEL_LABEL: Record<NivelInsigniaEmpresa, string> = {
  bronce: 'Bronce',
  plata: 'Plata',
  oro: 'Oro',
};

/**
 * Bloque "Insignias activas" (PP-75): insignias empresariales obtenidas,
 * ordenadas por fecha de obtención descendente, con acceso directo a la
 * vista de detalle de cada una.
 *
 * Presentacional: el fetch y el manejo de error viven en la página
 * contenedora (mismo patrón que `estado-certificaciones-panel` /
 * `calendario-vencimientos`), para que una falla acá no afecte a los demás
 * bloques del dashboard de Certificaciones.
 */
@Component({
  selector: 'app-insignias-empresa-panel',
  imports: [DatePipe, HeadingComponent, IconComponent, LinkDirective, RouterLink],
  templateUrl: './insignias-empresa-panel.component.html',
  styleUrl: './insignias-empresa-panel.component.scss',
})
export class InsigniasEmpresaPanelComponent {
  readonly insignias = input<InsigniaEmpresa[] | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly sinInsigniasMensaje = SIN_INSIGNIAS_MENSAJE;
  protected readonly errorMensaje = computed(() => this.error() ?? ERROR_POR_DEFECTO);

  protected readonly insigniasOrdenadas = computed(() =>
    [...(this.insignias() ?? [])].sort(
      (a, b) => new Date(b.fechaObtencion).getTime() - new Date(a.fechaObtencion).getTime()
    )
  );

  protected llave(insignia: InsigniaEmpresa): string {
    return `${insignia.idInsignia}-${insignia.nivelInsignia}`;
  }

  protected nivelLabel(nivel: NivelInsigniaEmpresa): string {
    return NIVEL_LABEL[nivel];
  }
}
