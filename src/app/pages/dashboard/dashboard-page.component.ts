import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CardStatComponent } from '../../shared/components/card-stat/card-stat.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import {
  HeaderConfig,
  PageLayoutComponent,
  SidebarConfig,
} from '../../shared/layouts/page-layout/page-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { ComparacionEmisionesResponse, EstadoComparacion } from '../emissions/models/emision.model';
import { EmisionesService } from '../emissions/emisiones.service';

interface EstadoVisual {
  label: string;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [CardStatComponent, PageLayoutComponent, RouterLink, SelectInputComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly emisionesService = inject(EmisionesService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

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

  protected readonly sidebarConfig = computed<SidebarConfig>(() => ({
    menuItems: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: true },
      { id: 'emissions', label: 'Mis Emisiones', icon: 'emisiones', active: false },
      { id: 'auditores', label: 'Auditores', icon: 'auditores', active: false },
      { id: 'auditorias', label: 'Auditorías', icon: 'auditorias', active: false },
      { id: 'certificaciones', label: 'Certificaciones', icon: 'certificaciones', active: false },
      { id: 'insignias', label: 'Insignias', icon: 'insignias', active: false },
    ],
    bottomItems: [
      { id: 'configuracion', label: 'Configuración', icon: 'config' },
      { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
    ],
    companyName: 'Café del Valle S.A.',
    companyRole: 'Empresa · Admin',
    companyInitials: 'CV',
  }));

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
    this.cargarComparacion(this.anioSeleccionado());
  }

  protected onAnioChange(valor: string): void {
    const anio = Number(valor);
    if (!Number.isInteger(anio)) return;

    this.anioSeleccionado.set(anio);
    this.cargarComparacion(anio);
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

  protected onMenuItem(id: string): void {
    const rutas: Record<string, string> = {
      dashboard: '/panel',
      emissions: '/emisiones/registrar',
      configuracion: '/configuracion',
      settings: '/configuracion',
      logout: '/login',
    };
    const ruta = rutas[id];
    if (ruta) void this.router.navigateByUrl(ruta);
  }

  private cargarComparacion(anio: number): void {
    this.cargando.set(true);
    this.emisionesService.obtenerComparacion(anio).subscribe({
      next: (comparacion) => {
        this.comparacion.set(comparacion);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toastService.error(
          'No se pudo cargar la comparación. Intente nuevamente.',
          undefined,
          5000
        );
      },
    });
  }
}
