import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { CardStatComponent } from '../../shared/components/card-stat/card-stat.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { LinkDirective } from '../../shared/components/link/link.directive';
import { HeaderConfig } from '../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { ComparacionEmisionesResponse, EstadoComparacion } from '../emissions/models/emision.model';
import { EmisionesService } from '../emissions/emisiones.service';

interface EstadoVisual {
  label: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CardStatComponent,
    LinkDirective,
    RouterLink,
    SelectInputComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly emisionesService = inject(EmisionesService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);

  protected readonly anioActual = new Date().getFullYear();
  protected readonly anioSeleccionado = signal(this.anioActual);
  protected readonly comparacion = signal<ComparacionEmisionesResponse | null>(null);
  protected readonly cargando = signal(false);

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
    userInitials: this.authSession.getUserInitials(),
  }));

  protected readonly consumoBarra = computed(() => {
    const porcentaje = this.comparacion()?.porcentajeConsumido ?? 0;
    return Math.min(Math.max(porcentaje, 0), 100);
  });

  ngOnInit(): void {
    void this.cargarComparacion(this.anioSeleccionado());
  }

  protected onAnioChange(valor: string): void {
    const anio = Number(valor);
    if (!Number.isInteger(anio)) return;

    this.anioSeleccionado.set(anio);
    void this.cargarComparacion(anio);
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

  private async cargarComparacion(anio: number): Promise<void> {
    this.cargando.set(true);
    try {
      const comparacion = await firstValueFrom(this.emisionesService.obtenerComparacion(anio));
      this.comparacion.set(comparacion);
    } catch (err: unknown) {
      this.toastService.error(
        apiErrorMessage(err) ?? 'No se pudo cargar la comparación. Intente nuevamente.',
        undefined,
        5000
      );
    } finally {
      this.cargando.set(false);
    }
  }
}
