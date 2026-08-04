import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { LinkDirective } from '../../shared/components/link/link.directive';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { DashboardService } from '../dashboard/dashboard.service';
import {
  CalendarioVencimientosResponse,
  ResumenCertificacionesDashboardResponse,
} from '../dashboard/dashboard.model';
import { CalendarioVencimientosComponent } from './calendario-vencimientos.component';
import { EstadoCertificacionesPanelComponent } from './estado-certificaciones-panel.component';

const ERROR_RESUMEN_MENSAJE = 'No fue posible cargar esta sección. Intenta recargar la página.';

function mesActual(): string {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  return `${hoy.getFullYear()}-${mes < 10 ? `0${mes}` : mes}`;
}

/**
 * Pantalla de Certificaciones. Aloja el bloque "Estado de certificaciones"
 * (PP-74), el "Calendario de vencimientos" (PP-77) y un enlace al listado
 * completo con filtros (PP-59).
 */
@Component({
  selector: 'app-certificaciones-page',
  imports: [
    ShellLayoutComponent,
    EstadoCertificacionesPanelComponent,
    CalendarioVencimientosComponent,
    LinkDirective,
    RouterLink,
  ],
  templateUrl: './certificaciones-page.component.html',
  styleUrl: './certificaciones-page.component.scss',
})
export class CertificacionesPageComponent {
  private readonly dashboardService = inject(DashboardService);
  private solicitudCalendario = 0;

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'CERTIFICACIONES',
    pageTitle: 'Certificaciones',
    showNotificationDot: false,
  }));

  protected readonly cargandoResumen = signal(false);
  protected readonly resumen = signal<ResumenCertificacionesDashboardResponse | null>(null);
  protected readonly resumenError = signal<string | null>(null);

  protected readonly mesCalendario = signal(mesActual());
  protected readonly cargandoCalendario = signal(false);
  protected readonly calendario = signal<CalendarioVencimientosResponse | null>(null);
  protected readonly calendarioError = signal<string | null>(null);

  constructor() {
    void this.cargarResumen();
    void this.cargarCalendario(this.mesCalendario());
  }

  protected onMesCalendarioChange(mes: string): void {
    this.mesCalendario.set(mes);
    void this.cargarCalendario(mes);
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

  private async cargarCalendario(mes: string): Promise<void> {
    const solicitud = ++this.solicitudCalendario;
    this.cargandoCalendario.set(true);
    this.calendarioError.set(null);
    try {
      const calendario = await firstValueFrom(
        this.dashboardService.obtenerCalendarioVencimientos(mes)
      );
      if (solicitud !== this.solicitudCalendario) return;
      this.calendario.set(calendario);
    } catch (err: unknown) {
      if (solicitud !== this.solicitudCalendario) return;
      this.calendario.set(null);
      this.calendarioError.set(apiErrorMessage(err) ?? ERROR_RESUMEN_MENSAJE);
    } finally {
      if (solicitud === this.solicitudCalendario) {
        this.cargandoCalendario.set(false);
      }
    }
  }
}
