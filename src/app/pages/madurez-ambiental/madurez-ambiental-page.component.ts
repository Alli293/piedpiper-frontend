import { Component, computed, inject, signal } from '@angular/core';
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
import { ImaEvento, ImaService, ImaTendenciaPunto } from '../dashboard/ima.service';
import { ImaTendenciaChartComponent } from './ima-tendencia-chart.component';

const MESES_VENTANA_DEFECTO = 12;
const TOAST_DURACION_MS = 5000;

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
    HeadingComponent,
    ImaTendenciaChartComponent,
    SelectInputComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './madurez-ambiental-page.component.html',
  styleUrl: './madurez-ambiental-page.component.scss',
})
export class MadurezAmbientalPageComponent {
  private readonly imaService = inject(ImaService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  protected readonly String = String;

  protected readonly sinHistorialMensaje = SIN_HISTORIAL_MENSAJE;
  protected readonly sinSectorMensaje = SIN_SECTOR_MENSAJE;
  protected readonly ventanaOptions = VENTANAS;

  protected readonly cargando = signal(false);
  protected readonly serie = signal<ImaTendenciaPunto[]>([]);
  protected readonly eventos = signal<ImaEvento[]>([]);
  protected readonly sinDatosSectoriales = signal(false);
  protected readonly ventana = signal(MESES_VENTANA_DEFECTO);

  /** Solo hay historial si al menos un mes trae IMA de la empresa. */
  protected readonly sinHistorial = computed(
    () => !this.cargando() && this.serie().every((punto) => punto.imaEmpresa === null)
  );

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Madurez ambiental',
    showNotificationDot: true,
    userInitials: this.authSession.getUserInitials(),
  }));

  constructor() {
    void this.cargarTendencia(this.ventana());
  }

  protected onVentanaChange(valor: string): void {
    const meses = Number(valor);
    this.ventana.set(meses);
    void this.cargarTendencia(meses);
  }

  private async cargarTendencia(mesesAtras: number): Promise<void> {
    this.cargando.set(true);
    try {
      const respuesta = await firstValueFrom(this.imaService.obtenerTendencia(mesesAtras));
      this.serie.set(respuesta.serie);
      this.eventos.set(respuesta.eventos ?? []);
      this.sinDatosSectoriales.set(respuesta.sinDatosSectoriales);
    } catch (err: unknown) {
      this.serie.set([]);
      this.eventos.set([]);
      this.sinDatosSectoriales.set(false);
      this.toastService.error(
        apiErrorMessage(err) ?? ERROR_TENDENCIA_MENSAJE,
        undefined,
        TOAST_DURACION_MS
      );
    } finally {
      this.cargando.set(false);
    }
  }
}
