import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EMPTY, Subscription, firstValueFrom, timer } from 'rxjs';
import { catchError, switchMap, take, takeWhile } from 'rxjs/operators';
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
const NO_DISPONIBLE = 'No disponible';
/** La interpretación IA se genera en diferido en el backend (reintento cada ~5 min). */
export const INTERVALO_SONDEO_INTERPRETACION_MS = 15_000;
const INTENTOS_MAXIMOS_SONDEO_INTERPRETACION = 20;
/** Meses de la tendencia sin snapshot pero con emisiones: el backend los completa en segundo plano. */
export const INTERVALO_SONDEO_TENDENCIA_MS = 20_000;
const INTENTOS_MAXIMOS_SONDEO_TENDENCIA = 15;

export const ERROR_IMA_MENSAJE = 'No se pudo calcular tu IMA. Intente nuevamente.';
export const ERROR_TENDENCIA_MENSAJE =
  'No se pudo cargar la tendencia del IMA. Intente nuevamente.';
export const ERROR_BENCHMARK_MENSAJE =
  'No se pudo cargar la comparación contra tu sector. Intente nuevamente.';
export const SIN_HISTORIAL_MENSAJE = 'Aún no hay historial de IMA para mostrar.';
export const SIN_SECTOR_MENSAJE = 'Sin datos sectoriales suficientes para comparar.';
export const COMPLETANDO_TENDENCIA_MENSAJE = 'Calculando meses adicionales del historial…';

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
export class MadurezAmbientalPageComponent implements OnInit, OnDestroy {
  private readonly imaService = inject(ImaService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  protected readonly String = String;

  protected readonly sinHistorialMensaje = SIN_HISTORIAL_MENSAJE;
  protected readonly sinSectorMensaje = SIN_SECTOR_MENSAJE;
  protected readonly completandoTendenciaMensaje = COMPLETANDO_TENDENCIA_MENSAJE;
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
  protected readonly completandoTendencia = signal(false);
  protected readonly ventana = signal(MESES_VENTANA_DEFECTO);

  /** Guards contra respuestas fuera de orden (mismo patrón que emissions-list-page). */
  private cargaImaRequestId = 0;
  private cargaTendenciaRequestId = 0;
  private cargaBenchmarkRequestId = 0;

  private sondeoInterpretacion?: Subscription;
  private sondeoTendencia?: Subscription;

  /**
   * Solo hay historial si al menos un mes trae IMA de la empresa. Si el backend todavía está
   * completando meses en segundo plano, no se muestra "sin historial" — sería prematuro mientras
   * esos meses están por llegar.
   */
  protected readonly sinHistorial = computed(
    () =>
      !this.cargando() &&
      !this.completandoTendencia() &&
      this.serie().every((punto) => punto.imaEmpresa === null)
  );

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'BENCHMARK SECTORIAL',
    pageTitle: 'Madurez Ambiental',
    userInitials: this.authSession.getUserInitials(),
  }));

  ngOnInit(): void {
    void this.cargarIma(this.anioSeleccionado(), this.mesSeleccionado());
    void this.cargarBenchmark(this.anioSeleccionado(), this.mesSeleccionado());
    void this.cargarTendencia(this.ventana());
  }

  ngOnDestroy(): void {
    this.sondeoInterpretacion?.unsubscribe();
    this.sondeoTendencia?.unsubscribe();
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
    this.sondeoInterpretacion?.unsubscribe();
    const requestId = ++this.cargaImaRequestId;
    this.cargandoIma.set(true);
    this.errorIma.set(false);
    try {
      const ima = await firstValueFrom(this.imaService.obtenerIma(anio, mes));
      if (requestId !== this.cargaImaRequestId) return;
      this.imaData.set(ima);
      if (this.interpretacionPendiente(ima)) {
        this.sondearInterpretacion(anio, mes);
      }
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

  private interpretacionPendiente(ima: ImaResponse): boolean {
    return ima.interpretacion === NO_DISPONIBLE || ima.siguientePaso === NO_DISPONIBLE;
  }

  /**
   * El backend genera la interpretación IA en diferido (reintento cada ~5 min), así que un IMA
   * recién calculado llega con "No disponible". Se sondea en segundo plano, sin loader ni toasts,
   * hasta que la interpretación llegue o se agoten los intentos; cargarIma cancela este sondeo
   * al arrancar, así que un cambio de período no lo deja corriendo contra un período viejo.
   */
  private sondearInterpretacion(anio: number, mes: number): void {
    this.sondeoInterpretacion = timer(
      INTERVALO_SONDEO_INTERPRETACION_MS,
      INTERVALO_SONDEO_INTERPRETACION_MS
    )
      .pipe(
        take(INTENTOS_MAXIMOS_SONDEO_INTERPRETACION),
        switchMap(() => this.imaService.obtenerIma(anio, mes).pipe(catchError(() => EMPTY))),
        takeWhile((ima) => this.interpretacionPendiente(ima), true)
      )
      .subscribe((ima) => {
        if (anio !== this.anioSeleccionado() || mes !== this.mesSeleccionado()) return;
        this.imaData.set(ima);
      });
  }

  private async cargarTendencia(mesesAtras: number): Promise<void> {
    this.sondeoTendencia?.unsubscribe();
    const requestId = ++this.cargaTendenciaRequestId;
    this.cargando.set(true);
    try {
      const respuesta = await firstValueFrom(this.imaService.obtenerTendencia(mesesAtras));
      if (requestId !== this.cargaTendenciaRequestId) return;
      this.serie.set(respuesta.serie);
      this.eventos.set(respuesta.eventos ?? []);
      this.sinDatosSectoriales.set(respuesta.sinDatosSectoriales);
      this.completandoTendencia.set(respuesta.completando);
      if (respuesta.completando) {
        this.sondearTendencia(mesesAtras);
      }
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

  /**
   * El backend detecta meses con emisiones pero sin snapshot y los calcula en segundo plano
   * (completando=true en la respuesta), sin bloquear /tendencia. Se sondea acá hasta que
   * completando pase a false o se agoten los intentos; cargarTendencia cancela este sondeo al
   * arrancar, así que cambiar la ventana no lo deja corriendo contra una ventana vieja.
   */
  private sondearTendencia(mesesAtras: number): void {
    this.sondeoTendencia = timer(INTERVALO_SONDEO_TENDENCIA_MS, INTERVALO_SONDEO_TENDENCIA_MS)
      .pipe(
        take(INTENTOS_MAXIMOS_SONDEO_TENDENCIA),
        switchMap(() => this.imaService.obtenerTendencia(mesesAtras).pipe(catchError(() => EMPTY))),
        takeWhile((respuesta) => respuesta.completando, true)
      )
      .subscribe((respuesta) => {
        if (mesesAtras !== this.ventana()) return;
        this.serie.set(respuesta.serie);
        this.eventos.set(respuesta.eventos ?? []);
        this.sinDatosSectoriales.set(respuesta.sinDatosSectoriales);
        this.completandoTendencia.set(respuesta.completando);
      });
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
        apiErrorMessage(err) ?? ERROR_BENCHMARK_MENSAJE,
        undefined,
        TOAST_DURACION_MS
      );
    }
  }
}
