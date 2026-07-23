import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../../shared/components/inputs/select-input/select-input.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { EmisionesService } from '../emisiones.service';
import { CategoriaFiltroEmision, EmisionResponse } from '../models/emision.model';

interface CategoriaOption {
  readonly value: CategoriaFiltroEmision;
  readonly label: string;
  readonly icon: 'emisiones' | 'electricidad' | 'flota-vehicular' | 'vuelos' | 'envios-carga';
}

const CATEGORY_OPTIONS: CategoriaOption[] = [
  { value: 'TODAS', label: 'Todas', icon: 'emisiones' },
  { value: 'ELECTRICIDAD', label: 'Electricidad', icon: 'electricidad' },
  { value: 'FLOTA', label: 'Flota', icon: 'flota-vehicular' },
  { value: 'VUELO', label: 'Vuelos', icon: 'vuelos' },
  { value: 'ENVIO', label: 'Envíos', icon: 'envios-carga' },
];

const MONTH_OPTIONS: SelectOption[] = [
  { value: '', label: 'Mes: Todos' },
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

@Component({
  selector: 'app-emissions-list-page',
  imports: [
    ButtonComponent,
    HeadingComponent,
    IconComponent,
    SelectInputComponent,
    ShellLayoutComponent,
  ],
  templateUrl: './emissions-list-page.component.html',
  styleUrl: './emissions-list-page.component.scss',
})
export class EmissionsListPageComponent {
  private readonly emisionesService = inject(EmisionesService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private cargaRegistrosRequestId = 0;

  protected readonly registros = signal<EmisionResponse[]>([]);
  protected readonly registrosConteo = signal<EmisionResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly confirmTarget = signal<EmisionResponse | null>(null);
  protected readonly filtroCategoria = signal<CategoriaFiltroEmision>('TODAS');
  protected readonly filtroAnio = signal<number | null>(new Date().getFullYear());
  protected readonly filtroMes = signal<number | null>(null);

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly monthOptions = MONTH_OPTIONS;
  protected readonly totalCarbonKg = computed(() =>
    this.registros().reduce((total, registro) => total + (registro.carbonKg ?? 0), 0)
  );
  protected readonly yearOptions = computed<SelectOption[]>(() => {
    const currentYear = new Date().getFullYear();
    return [
      { value: '', label: 'Año: Todos' },
      ...Array.from({ length: currentYear - 1999 }, (_, index) => {
        const year = String(currentYear - index);
        return { value: year, label: `Año ${year}` };
      }),
    ];
  });
  protected readonly filtroAnioValue = computed(() => this.filtroAnio()?.toString() ?? '');
  protected readonly filtroMesValue = computed(() => this.filtroMes()?.toString() ?? '');

  protected readonly headerConfig = signal<HeaderConfig>({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Mis Emisiones',
    showNotificationDot: true,
    userInitials: 'MR',
  });

  constructor() {
    void this.cargarRegistros();
  }

  protected async cargarRegistros(): Promise<void> {
    const requestId = ++this.cargaRegistrosRequestId;
    this.loading.set(true);
    try {
      const filtrosPeriodo = {
        anio: this.filtroAnio(),
        mes: this.filtroMes(),
      };
      const categoria = this.filtroCategoria();
      const registros = await firstValueFrom(this.emisionesService.listarEmisiones());
      if (requestId !== this.cargaRegistrosRequestId) return;
      const registrosPeriodo = registros.filter((registro) =>
        cumpleFiltros(registro, 'TODAS', filtrosPeriodo.anio, filtrosPeriodo.mes)
      );
      this.registros.set(
        registrosPeriodo.filter((registro) =>
          cumpleFiltros(registro, categoria, filtrosPeriodo.anio, filtrosPeriodo.mes)
        )
      );
      this.registrosConteo.set(registrosPeriodo);
    } catch (error: unknown) {
      if (requestId !== this.cargaRegistrosRequestId) return;
      this.toastService.error(
        apiErrorMessage(error) ?? 'No se pudo completar la operación. Intente nuevamente.'
      );
      this.registros.set([]);
      this.registrosConteo.set([]);
    } finally {
      if (requestId === this.cargaRegistrosRequestId) {
        this.loading.set(false);
      }
    }
  }

  protected cambiarCategoria(value: string): void {
    this.filtroCategoria.set(value as CategoriaFiltroEmision);
    void this.cargarRegistros();
  }

  protected cambiarAnio(value: string): void {
    this.filtroAnio.set(value ? Number(value) : null);
    void this.cargarRegistros();
  }

  protected cambiarMes(value: string): void {
    this.filtroMes.set(value ? Number(value) : null);
    void this.cargarRegistros();
  }

  protected alPresionarTeclaModal(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelarEliminar();
    }
  }

  protected solicitarEliminar(registro: EmisionResponse): void {
    this.confirmTarget.set(registro);
  }

  protected cancelarEliminar(): void {
    this.confirmTarget.set(null);
  }

  protected async confirmarEliminar(): Promise<void> {
    const registro = this.confirmTarget();
    if (!registro || this.deletingId()) return;

    this.deletingId.set(registro.id);
    try {
      await firstValueFrom(this.emisionesService.eliminarEmision(registro.id));
      this.registros.update((registros) => registros.filter((item) => item.id !== registro.id));
      this.registrosConteo.update((registros) =>
        registros.filter((item) => item.id !== registro.id)
      );
      this.toastService.success('Registro eliminado.');
      this.confirmTarget.set(null);
    } catch (error: unknown) {
      this.manejarErrorEliminacion(error);
    } finally {
      this.deletingId.set(null);
    }
  }

  protected registrarEmision(): void {
    void this.router.navigateByUrl('/emisiones/registrar');
  }

  protected verLimitesAnuales(): void {
    void this.router.navigateByUrl('/limites');
  }

  protected categoriaLabel(registro: EmisionResponse): string {
    return (
      CATEGORY_OPTIONS.find((option) => option.value === registro.categoria)?.label ??
      registro.categoria
    );
  }

  protected categoriaIcon(registro: EmisionResponse): CategoriaOption['icon'] {
    return (
      CATEGORY_OPTIONS.find((option) => option.value === registro.categoria)?.icon ?? 'emisiones'
    );
  }

  protected registrosPorCategoria(categoria: CategoriaFiltroEmision): number {
    if (categoria === 'TODAS') return this.registrosConteo().length;
    return this.registrosConteo().filter((registro) => registro.categoria === categoria).length;
  }

  protected detallePrincipal(registro: EmisionResponse): string {
    if (registro.titulo?.trim()) return registro.titulo;
    if (registro.categoria === 'ELECTRICIDAD') return 'Consumo eléctrico';
    if (registro.categoria === 'FLOTA') return formatText(registro.tipoVehiculo);
    if (registro.categoria === 'VUELO') return this.rutaVuelo(registro);
    if (registro.categoria === 'ENVIO') return 'Envío de carga';
    return 'Registro de emisión';
  }

  protected detalleSecundario(registro: EmisionResponse): string {
    if (registro.categoria === 'ELECTRICIDAD') {
      return `${formatNumber(registro.electricityValue)} ${registro.electricityUnit ?? 'kwh'}`;
    }
    if (registro.categoria === 'FLOTA') {
      return `${formatText(registro.combustible)} - ${formatNumber(registro.distanceValue)} ${registro.distanceUnit ?? 'km'}`;
    }
    if (registro.categoria === 'VUELO') {
      return `${this.rutaVuelo(registro)} x${registro.passengers ?? 1} pas.`;
    }
    if (registro.categoria === 'ENVIO') {
      return `${formatText(registro.transportMethod)} ${formatNumber(registro.weightValue)} ${registro.weightUnit ?? 'KG'} - ${formatNumber(registro.distanceValue)} ${registro.distanceUnit ?? 'km'}`;
    }
    return '';
  }

  protected formatFecha(fecha: string): string {
    const fechaActividad = parseFechaActividad(fecha);
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(fechaActividad.anio, fechaActividad.mes - 1, fechaActividad.dia));
  }

  protected formatCarbonKg(value: number): string {
    return new Intl.NumberFormat('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(value);
  }

  private manejarErrorEliminacion(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        this.toastService.error(
          apiErrorMessage(error) ?? 'El registro ya no existe o fue eliminado.'
        );
        this.confirmTarget.set(null);
        void this.cargarRegistros();
        return;
      }
      if (error.status === 403) {
        this.toastService.error(
          apiErrorMessage(error) ?? 'No tiene permiso para eliminar este registro.'
        );
        return;
      }
    }
    this.toastService.error(
      apiErrorMessage(error) ?? 'No se pudo completar la operación. Intente nuevamente.'
    );
  }

  private rutaVuelo(registro: EmisionResponse): string {
    if (!registro.legs?.length) return registro.titulo || 'Vuelo';
    return registro.legs
      .map((leg) => `${leg.departureAirport}->${leg.destinationAirport}`)
      .join(', ');
  }
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

function cumpleFiltros(
  registro: EmisionResponse,
  categoria: CategoriaFiltroEmision,
  anio: number | null,
  mes: number | null
): boolean {
  if (categoria !== 'TODAS' && registro.categoria !== categoria) return false;
  const fecha = parseFechaActividad(registro.fechaActividad);
  if (anio !== null && fecha.anio !== anio) return false;
  if (mes !== null && fecha.mes !== mes) return false;
  return true;
}

function parseFechaActividad(fecha: string): { anio: number; mes: number; dia: number } {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return { anio, mes, dia };
}

function formatText(value: string | undefined): string {
  if (!value) return 'Sin detalle';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
