import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LinkDirective } from '../../shared/components/link/link.directive';
import { MetaReduccion } from '../metas/metas.model';

const ERROR_POR_DEFECTO = 'No fue posible cargar esta sección. Intenta recargar la página.';
const SIN_METAS_MENSAJE = 'No has registrado metas de reducción aún.';
const RUTA_REGISTRAR_META = '/empresa/metas/registrar';

/**
 * Módulo "Metas de reducción" (PP-78): metas activas de la empresa con su
 * progreso, calculado en el backend contra el período actual (mismo
 * cálculo que el bloque "Resumen de huella" del dashboard principal,
 * aunque viven en pantallas distintas).
 *
 * Presentacional: el fetch y el manejo de error viven en
 * `certificaciones-page`, junto al resto de los bloques del dashboard de
 * Certificaciones — una falla acá no afecta al resto de la página.
 */
@Component({
  selector: 'app-metas-reduccion-panel',
  imports: [ButtonComponent, DatePipe, HeadingComponent, IconComponent, LinkDirective, RouterLink],
  templateUrl: './metas-reduccion-panel.component.html',
  styleUrl: './metas-reduccion-panel.component.scss',
})
export class MetasReduccionPanelComponent {
  private readonly router = inject(Router);

  readonly metas = input<MetaReduccion[] | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);

  protected readonly rutaRegistrarMeta = RUTA_REGISTRAR_META;
  protected readonly sinMetasMensaje = SIN_METAS_MENSAJE;
  protected readonly errorMensaje = computed(() => this.error() ?? ERROR_POR_DEFECTO);

  protected readonly hayMetas = computed(() => (this.metas() ?? []).length > 0);

  protected barraAncho(meta: MetaReduccion): number {
    return Math.min(Math.max(meta.progresoPorcentaje, 0), 100);
  }

  protected irARegistrarMeta(): void {
    void this.router.navigateByUrl(RUTA_REGISTRAR_META);
  }
}
