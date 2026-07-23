import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardStatComponent } from '../../shared/components/card-stat/card-stat.component';
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

interface PeriodoResumenFormModel {
  anio: string;
  mes: string;
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

const ORDEN_CATEGORIAS: CategoriaResumen[] = ['ELECTRICIDAD', 'FLOTA', 'VUELO', 'ENVIO'];

// La etiqueta visible sigue el diseño de Figma; el valor interno es el del enum del backend.
const ETIQUETAS_CATEGORIA: Record<CategoriaResumen, string> = {
  ELECTRICIDAD: 'Electricidad',
  FLOTA: 'Flota vehicular',
  VUELO: 'Vuelos',
  ENVIO: 'Envíos',
};

const MESES: SelectOption[] = [
  { value: '', label: 'Todo el año' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
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
    IconComponent,
    LinkDirective,
    RouterLink,
    SelectInputComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly emisionesService = inject(EmisionesService);
  private readonly dashboardService = inject(DashboardService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  private readonly anioActual = new Date().getFullYear();
  private solicitudResumen = 0;

  protected readonly sinEmisionesMensaje = SIN_EMISIONES_MENSAJE;
  protected readonly circunferencia = DONA_CIRCUNFERENCIA;

  protected readonly model = signal<PeriodoResumenFormModel>({
    anio: String(this.anioActual),
    mes: '',
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

  // --- Comparación contra el límite anual ---
  protected readonly cargandoComparacion = signal(false);
  protected readonly comparacion = signal<ComparacionEmisionesResponse | null>(null);
  protected readonly exportandoPdf = signal(false);

  // Deshabilita el botón de exportar mientras cualquiera de las dos cargas esté en curso.
  protected readonly cargando = computed(
    () => this.cargandoResumen() || this.cargandoComparacion()
  );

  protected readonly anioOptions: SelectOption[] = Array.from(
    { length: this.anioActual - ANIO_MINIMO + 1 },
    (_, index) => {
      const anio = this.anioActual - index;
      return { value: String(anio), label: String(anio) };
    }
  );

  protected readonly mesOptions: SelectOption[] = MESES;

  protected readonly anioSeleccionado = computed(() => Number(this.periodoForm.anio().value()));

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

  constructor() {
    // El año gobierna ambas tarjetas; el mes solo afecta el desglose de la dona.
    effect(() => {
      const anioField = this.periodoForm.anio();
      const mesField = this.periodoForm.mes();
      const anio = anioField.value();
      const mes = mesField.value();
      if (!anioField.valid()) return;
      untracked(() => {
        void this.cargarResumen(Number(anio), mes === '' ? undefined : Number(mes));
      });
    });

    effect(() => {
      const anioField = this.periodoForm.anio();
      const anio = anioField.value();
      if (!anioField.valid()) return;
      untracked(() => {
        void this.cargarComparacion(Number(anio));
      });
    });
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
    this.cargandoComparacion.set(true);
    try {
      const comparacion = await firstValueFrom(this.emisionesService.obtenerComparacion(anio));
      this.comparacion.set(comparacion);
    } catch (err: unknown) {
      this.toastService.error(
        apiErrorMessage(err) ?? ERROR_COMPARACION_MENSAJE,
        undefined,
        TOAST_DURACION_MS
      );
    } finally {
      this.cargandoComparacion.set(false);
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

  private calcularPorcentaje(subtotalKg: number, totalKg: number): number {
    if (totalKg === 0) return 0;
    return Math.round((subtotalKg / totalKg) * 1000) / 10;
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
}
