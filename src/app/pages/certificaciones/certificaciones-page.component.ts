import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EmpresaService } from '../../core/empresa/empresa.service';
import { InsigniaEmpresa } from '../../core/empresa/empresa.models';
import { CertificacionResumen } from '../../core/models/certificacion.model';
import { CertificacionesService } from '../../core/services/certificaciones.service';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { DashboardService } from '../dashboard/dashboard.service';
import {
  CalendarioVencimientosResponse,
  RecomendacionRenovacion,
  ResumenCertificacionesDashboardResponse,
} from '../dashboard/dashboard.model';
import { CalendarioVencimientosComponent } from './calendario-vencimientos.component';
import { CertificacionesRecientesPanelComponent } from './certificaciones-recientes-panel.component';
import { EstadoCertificacionesPanelComponent } from './estado-certificaciones-panel.component';
import { InsigniasEmpresaPanelComponent } from './insignias-empresa-panel.component';
import { MetasReduccionPanelComponent } from './metas-reduccion-panel.component';
import { RecomendacionRenovacionPanelComponent } from './recomendacion-renovacion-panel.component';
import { MetaReduccion } from '../metas/metas.model';
import { MetasService } from '../metas/metas.service';

const ERROR_RESUMEN_MENSAJE = 'No fue posible cargar esta sección. Intenta recargar la página.';

function mesActual(): string {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  return `${hoy.getFullYear()}-${mes < 10 ? `0${mes}` : mes}`;
}

/**
 * Pantalla de Certificaciones. Aloja el bloque "Estado de certificaciones"
 * (PP-74), "Recomendación de renovación" (PP-72), "Certificaciones
 * recientes", "Insignias activas" (PP-75), "Metas de reducción" (PP-78) y
 * el "Calendario de vencimientos" (PP-77). Las alertas de vencimiento
 * (PP-76) se acceden desde las tarjetas de "Estado de certificaciones" o
 * el Centro de Alertas, no desde un bloque propio en este dashboard.
 */
@Component({
  selector: 'app-certificaciones-page',
  imports: [
    ShellLayoutComponent,
    CertificacionesRecientesPanelComponent,
    EstadoCertificacionesPanelComponent,
    CalendarioVencimientosComponent,
    InsigniasEmpresaPanelComponent,
    MetasReduccionPanelComponent,
    RecomendacionRenovacionPanelComponent,
  ],
  templateUrl: './certificaciones-page.component.html',
  styleUrl: './certificaciones-page.component.scss',
})
export class CertificacionesPageComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly empresaService = inject(EmpresaService);
  private readonly certificacionesService = inject(CertificacionesService);
  private readonly metasService = inject(MetasService);
  private solicitudCalendario = 0;

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'CERTIFICACIONES',
    pageTitle: 'Certificaciones y alertas inteligentes',
    showNotificationDot: false,
  }));

  protected readonly cargandoResumen = signal(false);
  protected readonly resumen = signal<ResumenCertificacionesDashboardResponse | null>(null);
  protected readonly resumenError = signal<string | null>(null);

  protected readonly mesCalendario = signal(mesActual());
  protected readonly cargandoCalendario = signal(false);
  protected readonly calendario = signal<CalendarioVencimientosResponse | null>(null);
  protected readonly calendarioError = signal<string | null>(null);

  protected readonly cargandoInsignias = signal(false);
  protected readonly insignias = signal<InsigniaEmpresa[]>([]);
  protected readonly insigniasError = signal<string | null>(null);

  protected readonly cargandoCertificaciones = signal(false);
  protected readonly certificaciones = signal<CertificacionResumen[]>([]);
  protected readonly certificacionesError = signal<string | null>(null);

  protected readonly cargandoMetas = signal(false);
  protected readonly metas = signal<MetaReduccion[]>([]);
  protected readonly metasError = signal<string | null>(null);

  protected readonly cargandoRecomendacion = signal(false);
  protected readonly recomendacion = signal<RecomendacionRenovacion | null>(null);
  protected readonly recomendacionError = signal<string | null>(null);

  constructor() {
    void this.cargarResumen();
    void this.cargarCalendario(this.mesCalendario());
    void this.cargarInsignias();
    void this.cargarCertificaciones();
    void this.cargarMetas();
    void this.cargarRecomendacion();
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

  private async cargarInsignias(): Promise<void> {
    this.cargandoInsignias.set(true);
    this.insigniasError.set(null);
    try {
      const insignias = await firstValueFrom(this.empresaService.listarInsignias());
      this.insignias.set(insignias);
    } catch (err: unknown) {
      this.insignias.set([]);
      this.insigniasError.set(apiErrorMessage(err) ?? ERROR_RESUMEN_MENSAJE);
    } finally {
      this.cargandoInsignias.set(false);
    }
  }

  private async cargarCertificaciones(): Promise<void> {
    this.cargandoCertificaciones.set(true);
    this.certificacionesError.set(null);
    try {
      const certificaciones = await firstValueFrom(this.certificacionesService.listar());
      this.certificaciones.set(certificaciones);
    } catch (err: unknown) {
      this.certificaciones.set([]);
      this.certificacionesError.set(apiErrorMessage(err) ?? ERROR_RESUMEN_MENSAJE);
    } finally {
      this.cargandoCertificaciones.set(false);
    }
  }

  private async cargarMetas(): Promise<void> {
    this.cargandoMetas.set(true);
    this.metasError.set(null);
    try {
      const metas = await firstValueFrom(this.metasService.listarMetas());
      this.metas.set(metas);
    } catch (err: unknown) {
      this.metas.set([]);
      this.metasError.set(apiErrorMessage(err) ?? ERROR_RESUMEN_MENSAJE);
    } finally {
      this.cargandoMetas.set(false);
    }
  }

  private async cargarRecomendacion(): Promise<void> {
    this.cargandoRecomendacion.set(true);
    this.recomendacionError.set(null);
    try {
      const recomendacion = await firstValueFrom(this.dashboardService.obtenerRecomendacion());
      this.recomendacion.set(recomendacion);
    } catch (err: unknown) {
      this.recomendacion.set(null);
      this.recomendacionError.set(apiErrorMessage(err) ?? ERROR_RESUMEN_MENSAJE);
    } finally {
      this.cargandoRecomendacion.set(false);
    }
  }
}
