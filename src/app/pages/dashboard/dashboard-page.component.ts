import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CardStatComponent } from '../../shared/components/card-stat/card-stat.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { ComparacionEmisionesResponse, EstadoComparacion } from '../emissions/models/emision.model';
import { EmisionesService } from '../emissions/emisiones.service';
import { EvolucionService, PuntoMensual } from './evolucion.service';
import { ImaService, ImaResponse, BenchmarkSectorialResponse } from './ima.service';
import { EvolucionChartComponent } from './evolucion-chart.component';
import { ImaPanelComponent } from './ima-panel.component';
import { BenchmarkPanelComponent } from './benchmark-panel.component';

interface EstadoVisual {
  label: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CardStatComponent,
    RouterLink,
    SelectInputComponent,
    ShellLayoutComponent,
    EvolucionChartComponent,
    ImaPanelComponent,
    BenchmarkPanelComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly emisionesService = inject(EmisionesService);
  private readonly evolucionService = inject(EvolucionService);
  private readonly imaService = inject(ImaService);
  private readonly toastService = inject(ToastService);

  protected readonly anioActual = new Date().getFullYear();
  protected readonly mesActual = new Date().getMonth() + 1;
  protected readonly anioSeleccionado = signal(this.anioActual);
  protected readonly comparacion = signal<ComparacionEmisionesResponse | null>(null);
  protected readonly cargando = signal(false);
  protected readonly evolucionSerie = signal<PuntoMensual[]>([]);
  protected readonly evolucionVacia = signal(false);
  protected readonly imaData = signal<ImaResponse | null>(null);
  protected readonly benchmarkData = signal<BenchmarkSectorialResponse | null>(null);

  protected readonly anios = computed<SelectOption[]>(() =>
    Array.from({ length: 6 }, (_, index) => {
      const anio = this.anioActual - index;
      return { value: String(anio), label: `Año ${anio}` };
    })
  );

  protected readonly anioSeleccionadoValue = computed(() => String(this.anioSeleccionado()));

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Dashboard',
    showNotificationDot: true,
    userInitials: 'MR',
  }));

  protected readonly consumoBarra = computed(() => {
    const porcentaje = this.comparacion()?.porcentajeConsumido ?? 0;
    return Math.min(Math.max(porcentaje, 0), 100);
  });

  ngOnInit(): void {
    void this.cargarComparacion(this.anioSeleccionado());
    void this.cargarEvolucion(this.anioSeleccionado());
    void this.cargarIma(this.anioSeleccionado(), this.mesActual);
    void this.cargarBenchmark(this.anioSeleccionado(), this.mesActual);
  }

  protected onAnioChange(valor: string): void {
    const anio = Number(valor);
    if (!Number.isInteger(anio)) return;

    this.anioSeleccionado.set(anio);
    void this.cargarComparacion(anio);
    void this.cargarEvolucion(anio);
    void this.cargarIma(anio, this.mesActual);
    void this.cargarBenchmark(anio, this.mesActual);
  }

  protected onImaPeriodoChange(evento: { anio: number; mes: number }): void {
    void this.cargarIma(evento.anio, evento.mes);
    void this.cargarBenchmark(evento.anio, evento.mes);
  }

  protected estadoVisual(estado: EstadoComparacion): EstadoVisual {
    const estados: Record<EstadoComparacion, EstadoVisual> = {
      dentro: { label: 'En meta' },
      cerca: { label: 'Cerca del límite' },
      superado: { label: 'Límite superado' },
      sin_limite: { label: 'Sin límite' },
    };
    return estados[estado];
  }

  protected tieneEstado(estado: EstadoComparacion): boolean {
    const comparacion = this.comparacion();
    return comparacion ? this.estadoPresentacion(comparacion) === estado : false;
  }

  protected estadoPresentacion(comparacion: ComparacionEmisionesResponse): EstadoComparacion {
    const porcentaje = comparacion.porcentajeConsumido;
    if (comparacion.limiteT === null || porcentaje === null) return 'sin_limite';
    if (porcentaje > 100) return 'superado';
    if (porcentaje >= 80) return 'cerca';
    return 'dentro';
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
      return 'Sin limite declarado';
    }

    return `${this.formatToneladas(comparacion.huellaAcumuladaT)} / ${this.formatToneladas(
      comparacion.limiteT
    )} tCO2e`;
  }

  private async cargarComparacion(anio: number): Promise<void> {
    this.cargando.set(true);
    try {
      const comparacion = await firstValueFrom(this.emisionesService.obtenerComparacion(anio));
      this.comparacion.set(comparacion);
    } catch {
      this.toastService.error(
        'No se pudo cargar la comparación. Intente nuevamente.',
        undefined,
        5000
      );
    } finally {
      this.cargando.set(false);
    }
  }

  private async cargarEvolucion(anio: number): Promise<void> {
    try {
      const resp = await firstValueFrom(this.evolucionService.obtenerEvolucion(anio));
      this.evolucionSerie.set(resp.serie);
      this.evolucionVacia.set(resp.serie.every((p) => p.totalCarbonKg === 0));
    } catch {
      this.toastService.error(
        'No se pudo cargar la evolución histórica. Intente nuevamente.',
        undefined,
        5000
      );
    }
  }

  private async cargarIma(anio: number, mes: number): Promise<void> {
    try {
      const ima = await firstValueFrom(this.imaService.obtenerIma(anio, mes));
      this.imaData.set(ima);
    } catch {
      this.toastService.error('No se pudo calcular tu IMA. Intente nuevamente.', undefined, 5000);
    }
  }

  private async cargarBenchmark(anio: number, mes: number): Promise<void> {
    try {
      const benchmark = await firstValueFrom(this.imaService.obtenerBenchmark(anio, mes));
      this.benchmarkData.set(benchmark);
    } catch {
      this.toastService.error(
        'No se pudo cargar el benchmark sectorial. Intente nuevamente.',
        undefined,
        5000
      );
    }
  }
}
