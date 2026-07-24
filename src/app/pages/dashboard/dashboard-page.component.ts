import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardStatComponent } from '../../shared/components/card-stat/card-stat.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { LinkDirective } from '../../shared/components/link/link.directive';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage, apiErrorMessageAsync } from '../../shared/utils/http-error.utils';
import {
  CategoriaResumen,
  ComparacionEmisionesResponse,
  EstadoComparacion,
  ResumenEmisionesResponse,
} from '../emissions/models/emision.model';
import { EmisionesService } from '../emissions/emisiones.service';
import { DashboardService } from './dashboard.service';
import { PeriodoDashboard, ResumenHuellaDashboardResponse } from './dashboard.model';
import { EvolucionService, PuntoMensual } from './evolucion.service';
import { ImaService, ImaResponse } from './ima.service';
import { EvolucionChartComponent } from './evolucion-chart.component';
import { ImaPanelComponent } from './ima-panel.component';

interface PeriodoResumenFormModel {
  anio: string;
}

interface SegmentoDesglose {
  readonly categoria: CategoriaResumen;
  readonly etiqueta: string;
  readonly totalKg: number;
  readonly porcentaje: number;
  readonly largo: number;
  readonly offset: number;
}

interface EstadoVisual {
  label: string;
}

interface CategoriaComparacionVisual {
  readonly categoria: CategoriaResumen;
  readonly label: string;
  readonly huellaT: number;
  readonly porcentaje: number;
  readonly color: string;
}

const ORDEN_CATEGORIAS: CategoriaResumen[] = ['ELECTRICIDAD', 'FLOTA', 'VUELO', 'ENVIO'];

// La etiqueta visible sigue el diseño de Figma; el valor interno es el del enum del backend.
const ETIQUETAS_CATEGORIA: Record<CategoriaResumen, string> = {
  ELECTRICIDAD: 'Electricidad',
  FLOTA: 'Flota vehicular',
  VUELO: 'Vuelos',
  ENVIO: 'Envíos',
};

const COLORES_CATEGORIA: Record<CategoriaResumen, string> = {
  ELECTRICIDAD: 'var(--ch-green)',
  FLOTA: 'var(--ch-sky)',
  VUELO: 'var(--ch-dark)',
  ENVIO: 'var(--ch-warning)',
};

const PERIODOS_DASHBOARD: SelectOption[] = [
  { value: 'mes_actual', label: 'Mes actual' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'año', label: 'Año' },
];

const ANIO_MINIMO = 2000;

const ERROR_RESUMEN_MENSAJE = 'No se pudo cargar el desglose. Intente nuevamente.';
const ERROR_COMPARACION_MENSAJE = 'No se pudo cargar la comparación. Intente nuevamente.';
const TOAST_DURACION_MS = 5000;

export const SIN_EMISIONES_MENSAJE = 'No hay emisiones registradas en el período seleccionado.';

/** Geometría del anillo del gráfico de dona (viewBox 0 0 160 160). */
export const DONA_RADIO = 60;
export const DONA_CIRCUNFERENCIA = 2 * Math.PI * DONA_RADIO;

@Component({
  selector: 'app-dashboard-page',
  imports: [
    ButtonComponent,
    CardStatComponent,
    DecimalPipe,
    FormField,
    HeadingComponent,
    IconComponent,
    LinkDirective,
    RouterLink,
    SelectInputComponent,
    ShellLayoutComponent,
    EvolucionChartComponent,
    ImaPanelComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly emisionesService = inject(EmisionesService);
  private readonly dashboardService = inject(DashboardService);
  private readonly evolucionService = inject(EvolucionService);
  private readonly imaService = inject(ImaService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  private readonly anioActual = new Date().getFullYear();
  private solicitudResumen = 0;
  private solicitudResumenHuella = 0;
  private comparacionSolicitudId = 0;

  protected readonly mesActual = new Date().getMonth() + 1;
  protected readonly mesSeleccionado = signal(this.mesActual);

  protected readonly sinEmisionesMensaje = SIN_EMISIONES_MENSAJE;
  protected readonly circunferencia = DONA_CIRCUNFERENCIA;

  protected readonly model = signal<PeriodoResumenFormModel>({
    anio: String(this.anioActual),
  });

  protected readonly periodoForm = form(
    this.model,
    schema<PeriodoResumenFormModel>((path) => {
      required(path.anio, { message: 'Seleccione un año válido.' });
    })
  );

  // --- Desglose por categoría (dona) ---
  protected readonly cargandoResumen = signal(false);
  protected readonly errorCarga = signal(false);
  protected readonly resumen = signal<ResumenEmisionesResponse | null>(null);

  // --- Resumen de huella por período (PP-73) ---
  protected readonly periodoSeleccionado = signal<PeriodoDashboard>('mes_actual');
  protected readonly resumenHuella = signal<ResumenHuellaDashboardResponse | null>(null);
  protected readonly cargandoResumenHuella = signal(false);
  protected readonly resumenHuellaError = signal<string | null>(null);

  // --- Comparación contra el límite anual ---
  protected readonly cargandoComparacion = signal(false);
  protected readonly comparacion = signal<ComparacionEmisionesResponse | null>(null);
  protected readonly comparacionError = signal<string | null>(null);
  protected readonly exportandoPdf = signal(false);

  // --- PP-41: Evolución histórica ---
  protected readonly evolucionSerie = signal<PuntoMensual[]>([]);
  protected readonly evolucionVacia = signal(false);

  // --- PP-79: IMA ---
  protected readonly imaData = signal<ImaResponse | null>(null);

  // Deshabilita el botón de exportar mientras cualquiera de las dos cargas esté en curso.
  protected readonly cargando = computed(
    () => this.cargandoResumen() || this.cargandoComparacion() || this.cargandoResumenHuella()
  );

  protected readonly anioOptions: SelectOption[] = Array.from(
    { length: this.anioActual - ANIO_MINIMO + 1 },
    (_, index) => {
      const anio = this.anioActual - index;
      return { value: String(anio), label: `Año ${anio}` };
    }
  );

  protected readonly periodos = PERIODOS_DASHBOARD;

  protected readonly anioSeleccionado = computed(() => Number(this.periodoForm.anio().value()));
  protected readonly periodoSeleccionadoValue = computed(() => this.periodoSeleccionado());

  protected readonly totalKg = computed(() => this.resumen()?.totalKg ?? 0);
  protected readonly totalT = computed(() => this.resumen()?.totalT ?? 0);
  protected readonly sinDatos = computed(() => this.resumen() !== null && this.totalKg() === 0);

  protected readonly desglose = computed<SegmentoDesglose[]>(() => {
    const resumen = this.resumen();
    if (!resumen) return [];
    const total = resumen.totalKg;
    let acumulado = 0;
    return ORDEN_CATEGORIAS.map((categoria) => {
      const fila = resumen.categorias.find((item) => item.categoria === categoria);
      const totalKg = fila?.totalKg ?? 0;
      const porcentaje = this.calcularPorcentaje(totalKg, total);
      const largo = (porcentaje / 100) * DONA_CIRCUNFERENCIA;
      const segmento: SegmentoDesglose = {
        categoria,
        etiqueta: ETIQUETAS_CATEGORIA[categoria],
        totalKg,
        porcentaje,
        largo,
        offset: -acumulado,
      };
      acumulado += largo;
      return segmento;
    });
  });

  protected readonly consumoBarra = computed(() => {
    const porcentaje = this.comparacion()?.porcentajeConsumido ?? 0;
    return Math.min(Math.max(porcentaje, 0), 100);
  });

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Dashboard',
    showNotificationDot: true,
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly periodoSelectorAriaLabel = computed(
    () => `Seleccionar período del resumen. Actual: ${this.periodoResumenOpcionLabel()}`
  );

  constructor() {
    // El año gobierna las tarjetas y el desglose anual de la dona.
    effect(() => {
      const anioField = this.periodoForm.anio();
      const anio = anioField.value();
      if (!anioField.valid()) return;
      untracked(() => {
        void this.cargarResumen(Number(anio));
      });
    });

    effect(() => {
      const anioField = this.periodoForm.anio();
      const anio = anioField.value();
      if (!anioField.valid()) return;
      untracked(() => {
        void this.cargarComparacion(Number(anio));
        void this.cargarResumenHuella(this.periodoSeleccionado(), Number(anio));
        void this.cargarEvolucion(Number(anio));
        void this.cargarIma(Number(anio), this.mesSeleccionado());
      });
    });
  }

  protected onImaPeriodoChange(evento: { anio: number; mes: number }): void {
    this.mesSeleccionado.set(evento.mes);
    void this.cargarIma(evento.anio, evento.mes);
  }

  protected onPeriodoChange(valor: string): void {
    const periodo = this.normalizarPeriodo(valor);
    this.periodoSeleccionado.set(periodo);
    void this.cargarResumenHuella(periodo, this.anioSeleccionado());
  }

  private async cargarResumen(anio: number, mes?: number): Promise<void> {
    const solicitud = ++this.solicitudResumen;
    this.cargandoResumen.set(true);
    this.errorCarga.set(false);
    try {
      const resumen = await firstValueFrom(this.emisionesService.obtenerResumen(anio, mes));
      if (solicitud !== this.solicitudResumen) return;
      this.resumen.set(resumen);
    } catch (err: unknown) {
      if (solicitud !== this.solicitudResumen) return;
      this.resumen.set(null);
      this.errorCarga.set(true);
      const mensajeApi =
        err instanceof HttpErrorResponse && typeof err.error?.message === 'string'
          ? err.error.message
          : undefined;
      this.toastService.error(mensajeApi ?? ERROR_RESUMEN_MENSAJE, undefined, TOAST_DURACION_MS);
    } finally {
      if (solicitud === this.solicitudResumen) {
        this.cargandoResumen.set(false);
      }
    }
  }

  private async cargarComparacion(anio: number): Promise<void> {
    const solicitud = ++this.comparacionSolicitudId;
    this.cargandoComparacion.set(true);
    this.comparacionError.set(null);
    try {
      const comparacion = await firstValueFrom(this.emisionesService.obtenerComparacion(anio));
      if (solicitud !== this.comparacionSolicitudId) return;
      this.comparacion.set(comparacion);
    } catch (err: unknown) {
      if (solicitud !== this.comparacionSolicitudId) return;
      const mensaje = apiErrorMessage(err) ?? ERROR_COMPARACION_MENSAJE;
      this.comparacion.set(null);
      this.comparacionError.set(mensaje);
      this.toastService.error(mensaje, undefined, TOAST_DURACION_MS);
    } finally {
      if (solicitud === this.comparacionSolicitudId) {
        this.cargandoComparacion.set(false);
      }
    }
  }

  protected async exportarPdf(): Promise<void> {
    const anio = this.anioSeleccionado();
    this.exportandoPdf.set(true);

    try {
      const blob = await firstValueFrom(this.dashboardService.exportarReportePdf(anio));
      this.descargarBlob(blob, `reporte-huella-${anio}.pdf`);
    } catch (error: unknown) {
      const fallback =
        error instanceof HttpErrorResponse && error.status >= 500
          ? 'No se pudo generar el reporte PDF. Intente nuevamente.'
          : 'No se pudo descargar el reporte. Intente nuevamente.';
      this.toastService.error((await apiErrorMessageAsync(error)) ?? fallback, undefined, 5000);
    } finally {
      this.exportandoPdf.set(false);
    }
  }

  protected estadoVisual(estado: EstadoComparacion): EstadoVisual {
    const estados: Record<EstadoComparacion, EstadoVisual> = {
      dentro: { label: 'En meta' },
      cerca: { label: 'Cerca del límite' },
      alcanzado: { label: 'Alcanzado' },
      superado: { label: 'Límite superado' },
      sin_limite: { label: 'Sin límite' },
    };
    return estados[estado];
  }

  protected tieneEstado(estado: EstadoComparacion): boolean {
    const comparacion = this.comparacion();
    return comparacion?.estado === estado;
  }

  protected formatToneladas(valor: number | null): string {
    if (valor === null) return '--';

    return new Intl.NumberFormat('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(valor);
  }

  protected formatPorcentaje(valor: number | null): string {
    if (valor === null) return '--';

    return new Intl.NumberFormat('es-CR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(valor);
  }

  protected porcentajeResumen(valor: number | null): string {
    if (valor === null) return '--';

    return `${this.formatPorcentaje(valor)} %`;
  }

  protected detalleLimiteResumen(comparacion: ComparacionEmisionesResponse): string {
    if (comparacion.limiteT === null || comparacion.porcentajeConsumido === null) {
      return 'Sin límite declarado';
    }

    return `${this.formatToneladas(comparacion.huellaAcumuladaT)} / ${this.formatToneladas(
      comparacion.limiteT
    )} tCO2e`;
  }

  protected periodoResumenOpcionLabel(): string {
    const option = PERIODOS_DASHBOARD.find((item) => item.value === this.periodoSeleccionado());
    return option?.label ?? 'Mes actual';
  }

  protected periodoResumenTitulo(periodo: PeriodoDashboard): string {
    if (periodo === 'trimestre') {
      return `Trimestre ${this.anioSeleccionado()}`;
    }
    if (periodo === 'año') {
      return `Año ${this.anioSeleccionado()}`;
    }

    const mes = new Intl.DateTimeFormat('es-CR', { month: 'long' }).format(new Date());
    return `${mes} ${this.anioSeleccionado()}`;
  }

  protected periodoResumenDetalle(periodo: PeriodoDashboard): string {
    if (periodo === 'trimestre') {
      return 'tCO₂e este trimestre';
    }
    if (periodo === 'año') {
      return 'tCO₂e este año';
    }

    return 'tCO₂e este mes';
  }

  protected variacionLabel(valor: number | null): string {
    if (valor === null) return '';

    const prefijo = valor > 0 ? '+' : '';
    return `${prefijo}${this.formatPorcentaje(valor)} % vs periodo anterior`;
  }

  protected variacionTipo(valor: number | null): 'sube' | 'baja' | 'igual' | null {
    if (valor === null) return null;
    if (valor > 0) return 'sube';
    if (valor < 0) return 'baja';
    return 'igual';
  }

  protected categoriasComparacion(
    comparacion: ComparacionEmisionesResponse
  ): CategoriaComparacionVisual[] {
    const categorias = comparacion.categorias ?? [];
    return ORDEN_CATEGORIAS.map((categoria) => {
      const data = categorias.find((item) => item.categoria === categoria);
      const huellaT = data?.huellaT ?? 0;
      return {
        categoria,
        label: ETIQUETAS_CATEGORIA[categoria],
        huellaT,
        porcentaje: data?.porcentaje ?? 0,
        color: COLORES_CATEGORIA[categoria],
      };
    });
  }

  private calcularPorcentaje(subtotalKg: number, totalKg: number): number {
    if (totalKg === 0) return 0;
    return Math.round((subtotalKg / totalKg) * 1000) / 10;
  }

  private async cargarResumenHuella(periodo: PeriodoDashboard, anio: number): Promise<void> {
    const solicitud = ++this.solicitudResumenHuella;
    this.cargandoResumenHuella.set(true);
    this.resumenHuellaError.set(null);
    try {
      const resumen = await firstValueFrom(
        this.dashboardService.obtenerResumenHuella(periodo, anio)
      );
      if (solicitud !== this.solicitudResumenHuella) return;
      this.resumenHuella.set(resumen);
      this.periodoSeleccionado.set(resumen.periodoSeleccionado);
    } catch (err: unknown) {
      if (solicitud !== this.solicitudResumenHuella) return;
      const fallback = await this.resumenHuellaDesdeEmisiones(periodo, anio);
      if (solicitud !== this.solicitudResumenHuella) return;
      if (fallback) {
        this.resumenHuella.set(fallback);
        this.periodoSeleccionado.set(fallback.periodoSeleccionado);
        return;
      }
      this.resumenHuella.set(null);
      this.resumenHuellaError.set(
        apiErrorMessage(err) ?? 'No fue posible cargar esta sección. Intenta recargar la página.'
      );
    } finally {
      if (solicitud === this.solicitudResumenHuella) {
        this.cargandoResumenHuella.set(false);
      }
    }
  }

  private async resumenHuellaDesdeEmisiones(
    periodo: PeriodoDashboard,
    anio: number
  ): Promise<ResumenHuellaDashboardResponse | null> {
    try {
      if (periodo === 'año') {
        const resumenAnual = await firstValueFrom(this.emisionesService.obtenerResumen(anio));
        return this.mapearResumenHuella(periodo, resumenAnual.totalT, resumenAnual.totalKg);
      }

      const meses =
        periodo === 'trimestre' ? this.mesesTrimestreActual() : [new Date().getMonth() + 1];
      const resumenes = await Promise.all(
        meses.map((mes) => firstValueFrom(this.emisionesService.obtenerResumen(anio, mes)))
      );
      const totalT = resumenes.reduce((total, resumen) => total + resumen.totalT, 0);
      const totalKg = resumenes.reduce((total, resumen) => total + resumen.totalKg, 0);
      return this.mapearResumenHuella(periodo, totalT, totalKg);
    } catch (_err: unknown) {
      return null;
    }
  }

  private mapearResumenHuella(
    periodo: PeriodoDashboard,
    huellaTotalT: number,
    totalKg: number
  ): ResumenHuellaDashboardResponse {
    return {
      periodoSeleccionado: periodo,
      huellaTotalT,
      variacionPorcentual: null,
      tieneDatos: totalKg > 0,
    };
  }

  private mesesTrimestreActual(): number[] {
    const mesActual = new Date().getMonth() + 1;
    const primerMes = Math.floor((mesActual - 1) / 3) * 3 + 1;
    return [primerMes, primerMes + 1, primerMes + 2];
  }

  private normalizarPeriodo(valor: string): PeriodoDashboard {
    if (valor === 'trimestre' || valor === 'año') {
      return valor;
    }
    return 'mes_actual';
  }

  private descargarBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  private async cargarEvolucion(anio: number): Promise<void> {
    try {
      const resp = await firstValueFrom(this.evolucionService.obtenerEvolucion(anio));
      this.evolucionSerie.set(resp.serie);
      this.evolucionVacia.set(resp.serie.every((p) => p.totalCarbonKg === 0));
    } catch (err: unknown) {
      this.toastService.error(
        apiErrorMessage(err) ?? 'No se pudo cargar la evolución histórica. Intente nuevamente.',
        undefined,
        5000
      );
    }
  }

  private async cargarIma(anio: number, mes: number): Promise<void> {
    try {
      const ima = await firstValueFrom(this.imaService.obtenerIma(anio, mes));
      this.imaData.set(ima);
    } catch (err: unknown) {
      this.toastService.error(
        apiErrorMessage(err) ?? 'No se pudo calcular tu IMA. Intente nuevamente.',
        undefined,
        5000
      );
    }
  }
}
