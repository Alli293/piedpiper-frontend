import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { DashboardService } from '../dashboard/dashboard.service';
import { ResumenCertificacionesDashboardResponse } from '../dashboard/dashboard.model';
import { EstadoCertificacionesPanelComponent } from './estado-certificaciones-panel.component';

const ERROR_RESUMEN_MENSAJE = 'No fue posible cargar esta sección. Intenta recargar la página.';

/**
 * Pantalla de Certificaciones. Por ahora solo aloja el bloque "Estado de
 * certificaciones" (PP-74); el listado completo con filtros llega en un PR
 * aparte — los enlaces del panel ya apuntan a esta misma ruta con
 * `?estado=...` para cuando ese listado exista.
 */
@Component({
  selector: 'app-certificaciones-page',
  imports: [ShellLayoutComponent, EstadoCertificacionesPanelComponent],
  templateUrl: './certificaciones-page.component.html',
  styleUrl: './certificaciones-page.component.scss',
})
export class CertificacionesPageComponent {
  private readonly dashboardService = inject(DashboardService);

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'CERTIFICACIONES',
    pageTitle: 'Certificaciones',
    showNotificationDot: false,
  }));

  protected readonly cargandoResumen = signal(false);
  protected readonly resumen = signal<ResumenCertificacionesDashboardResponse | null>(null);
  protected readonly resumenError = signal<string | null>(null);

  constructor() {
    void this.cargarResumen();
  }

  private async cargarResumen(): Promise<void> {
    this.cargandoResumen.set(true);
    this.resumenError.set(null);
    try {
      const resumen = await firstValueFrom(this.dashboardService.obtenerResumenCertificaciones());
      this.resumen.set(resumen);
    } catch (err: unknown) {
      this.resumen.set(null);
      this.resumenError.set(apiErrorMessage(err) ?? ERROR_RESUMEN_MENSAJE);
    } finally {
      this.cargandoResumen.set(false);
    }
  }
}
