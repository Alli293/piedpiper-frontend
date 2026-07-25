import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import {
  ImaEvento,
  ImaService,
  ImaResponse,
  ImaTendenciaPunto,
  BenchmarkSectorialResponse,
} from '../dashboard/ima.service';
import { ImaPanelComponent } from '../dashboard/ima-panel.component';
import { BenchmarkPanelComponent } from '../dashboard/benchmark-panel.component';
import { ImaTendenciaChartComponent } from './ima-tendencia-chart.component';

const MESES_VENTANA_DEFECTO = 12;
const TOAST_DURACION_MS = 5000;

export const ERROR_IMA_MENSAJE = 'No se pudo calcular tu IMA. Intente nuevamente.';
export const ERROR_TENDENCIA_MENSAJE =
  'No se pudo cargar la tendencia del IMA. Intente nuevamente.';
export const SIN_HISTORIAL_MENSAJE = 'Aún no hay historial de IMA para mostrar.';
export const SIN_SECTOR_MENSAJE = 'Sin datos sectoriales suficientes para comparar.';

const VENTANAS: SelectOption[] = [
  { value: '3', label: 'Últimos 3 meses' },
  { value: '6', label: 'Últimos 6 meses' },
  { value: '12', label: 'Últimos 12 meses' },
];

@Component({
  selector: 'app-madurez-ambiental-page',
  imports: [
    RouterLink,
    BenchmarkPanelComponent,
    HeadingComponent,
    ImaPanelComponent,
    ImaTendenciaChartComponent,
    SelectInputComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './madurez-ambiental-page.component.html',
  styleUrl: './madurez-ambiental-page.component.scss',
})
export class MadurezAmbientalPageComponent implements OnInit {
  private readonly imaService = inject(ImaService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  protected readonly String = String;

  protected readonly sinHistorialMensaje = SIN_HISTORIAL_MENSAJE;
  protected readonly sinSectorMensaje = SIN_SECTOR_MENSAJE;
  protected readonly ventanaOptions = VENTANAS;

  // --- Panel IMA del período (donut + dimensiones + interpretación IA) ---
  protected readonly anioSeleccionado = signal(new Date().getFullYear());
  protected readonly mesSeleccionado = signal(new Date().getMonth() + 1);
  protected readonly imaData = signal<ImaResponse | null>(null);
  protected readonly cargandoIma = signal(true);
  protected readonly errorIma = signal(false);

  // --- Comparación contra tu sector (benchmark) ---
  protected readonly benchmarkData = signal<BenchmarkSectorialResponse | null>(null);
  protected readonly benchmarkError = signal(false);

  // --- Evolución histórica del IMA ---
  protected readonly cargando = signal(false);
  protected readonly serie = signal<ImaTendenciaPunto[]>([]);
  protected readonly eventos = signal<ImaEvento[]>([]);
  protected readonly sinDatosSectoriales = signal(false);
  protected readonly ventana = signal(MESES_VENTANA_DEFECTO);

  /** Guards contra respuestas fuera de orden (mismo patrón que emissions-list-page). */
  private cargaImaRequestId = 0;
  private cargaTendenciaRequestId = 0;
  private cargaBenchmarkRequestId = 0;

  /** Solo hay historial si al menos un mes trae IMA de la empresa. */
  protected readonly sinHistorial = computed(
    () => !this.cargando() && this.serie().every((punto) => punto.imaEmpresa === null)
  );

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'MADUREZ AMBIENTAL',
    pageTitle: 'Índice de Madurez Ambiental (IMA)',
    showNotificationDot: true,
    userInitials: this.authSession.getUserInitials(),
  }));

  ngOnInit(): void {
    void this.cargarIma(this.anioSeleccionado(), this.mesSeleccionado());
    void this.cargarBenchmark(this.anioSeleccionado(), this.mesSeleccionado());
    void this.cargarTendencia(this.ventana());
  }

  protected onImaPeriodoChange(evento: { anio: number; mes: number }): void {
    this.mesSeleccionado.set(evento.mes);
    void this.cargarIma(evento.anio, evento.mes);
    void this.cargarBenchmark(evento.anio, evento.mes);
  }

  protected onVentanaChange(valor: string): void {
    // Ignora valores fuera de las opciones del select (defensa ante cambios futuros).
    if (!VENTANAS.some((opcion) => opcion.value === valor)) return;
    const meses = Number(valor);
    this.ventana.set(meses);
    void this.cargarTendencia(meses);
  }

  private async cargarIma(anio: number, mes: number): Promise<void> {
    const requestId = ++this.cargaImaRequestId;
    this.cargandoIma.set(true);
    this.errorIma.set(false);
    try {
      const ima = await firstValueFrom(this.imaService.obtenerIma(anio, mes));
      if (requestId !== this.cargaImaRequestId) return;
      this.imaData.set(ima);
    } catch (err: unknown) {
      if (requestId !== this.cargaImaRequestId) return;
      this.imaData.set(null);
      this.errorIma.set(true);
      this.toastService.error(
        apiErrorMessage(err) ?? ERROR_IMA_MENSAJE,
        undefined,
        TOAST_DURACION_MS
      );
    } finally {
      if (requestId === this.cargaImaRequestId) {
        this.cargandoIma.set(false);
      }
    }
  }

  private async cargarTendencia(mesesAtras: number): Promise<void> {
    const requestId = ++this.cargaTendenciaRequestId;
    this.cargando.set(true);
    try {
      const respuesta = await firstValueFrom(this.imaService.obtenerTendencia(mesesAtras));
      if (requestId !== this.cargaTendenciaRequestId) return;
      this.serie.set(respuesta.serie);
      this.eventos.set(respuesta.eventos ?? []);
      this.sinDatosSectoriales.set(respuesta.sinDatosSectoriales);
    } catch (err: unknown) {
      if (requestId !== this.cargaTendenciaRequestId) return;
      this.toastService.error(
        apiErrorMessage(err) ?? ERROR_TENDENCIA_MENSAJE,
        undefined,
        TOAST_DURACION_MS
      );
    } finally {
      if (requestId === this.cargaTendenciaRequestId) {
        this.cargando.set(false);
      }
    }
  }

  private async cargarBenchmark(anio: number, mes: number): Promise<void> {
    const requestId = ++this.cargaBenchmarkRequestId;
    this.benchmarkError.set(false);
    try {
      const benchmark = await firstValueFrom(this.imaService.obtenerBenchmark(anio, mes));
      if (requestId !== this.cargaBenchmarkRequestId) return;
      this.benchmarkData.set(benchmark);
    } catch (err: unknown) {
      if (requestId !== this.cargaBenchmarkRequestId) return;
      this.benchmarkError.set(true);
      this.toastService.error(
        apiErrorMessage(err) ?? 'No se pudo cargar la comparación contra tu sector.',
        undefined,
        TOAST_DURACION_MS
      );
    }
  }
}
