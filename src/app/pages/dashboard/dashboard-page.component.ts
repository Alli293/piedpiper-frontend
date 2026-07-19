import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { form, FormField, required, schema } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
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
import { EmisionesService } from '../emissions/emisiones.service';
import { CategoriaResumen, ResumenEmisionesResponse } from '../emissions/models/emision.model';

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

const ERROR_CARGA_MENSAJE = 'No se pudo cargar el desglose. Intente nuevamente.';
const TOAST_DURACION_MS = 5000;

export const SIN_EMISIONES_MENSAJE = 'No hay emisiones registradas en el período seleccionado.';

/** Geometría del anillo del gráfico de dona (viewBox 0 0 160 160). */
export const DONA_RADIO = 60;
export const DONA_CIRCUNFERENCIA = 2 * Math.PI * DONA_RADIO;

@Component({
  selector: 'app-dashboard-page',
  imports: [DecimalPipe, FormField, SelectInputComponent, PageLayoutComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  private readonly emisionesService = inject(EmisionesService);
  private readonly toastService = inject(ToastService);

  private readonly anioActual = new Date().getFullYear();
  private solicitudActual = 0;

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

  protected readonly cargando = signal(false);
  protected readonly errorCarga = signal(false);
  protected readonly resumen = signal<ResumenEmisionesResponse | null>(null);

  protected readonly anioOptions: SelectOption[] = Array.from(
    { length: this.anioActual - ANIO_MINIMO + 1 },
    (_, index) => {
      const anio = this.anioActual - index;
      return { value: String(anio), label: String(anio) };
    }
  );

  protected readonly mesOptions: SelectOption[] = MESES;

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

  protected readonly sidebarConfig = signal<SidebarConfig>({
    menuItems: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: true },
      { id: 'emissions', label: 'Mis Emisiones', icon: 'emisiones', active: false },
      { id: 'auditors', label: 'Auditores', icon: 'auditores', active: false },
      { id: 'audits', label: 'Auditorías', icon: 'auditorias', active: false },
      { id: 'certifications', label: 'Certificaciones', icon: 'certificaciones', active: false },
      { id: 'benchmark', label: 'Madurez ambiental', icon: 'benchmark', active: false },
      { id: 'badges', label: 'Insignias', icon: 'insignias', active: false },
      { id: 'public-profile', label: 'Perfil Público', icon: 'perfil-publico', active: false },
      { id: 'team-members', label: 'Colaboradores', icon: 'colaboradores', active: false },
    ],
    bottomItems: [
      { id: 'settings', label: 'Configuración', icon: 'config' },
      { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
    ],
    companyName: 'Café del Valle S.A.',
    companyRole: 'Empresa · Admin',
    companyInitials: 'CV',
  });

  protected readonly headerConfig = signal<HeaderConfig>({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Dashboard',
    showNotificationDot: true,
    userInitials: 'MR',
  });

  constructor() {
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
  }

  private async cargarResumen(anio: number, mes?: number): Promise<void> {
    const solicitud = ++this.solicitudActual;
    this.cargando.set(true);
    this.errorCarga.set(false);
    try {
      const resumen = await firstValueFrom(this.emisionesService.obtenerResumen(anio, mes));
      if (solicitud !== this.solicitudActual) return;
      this.resumen.set(resumen);
    } catch (err: unknown) {
      if (solicitud !== this.solicitudActual) return;
      this.resumen.set(null);
      this.errorCarga.set(true);
      const mensajeApi =
        err instanceof HttpErrorResponse && typeof err.error?.message === 'string'
          ? err.error.message
          : undefined;
      this.toastService.error(mensajeApi ?? ERROR_CARGA_MENSAJE, undefined, TOAST_DURACION_MS);
    } finally {
      if (solicitud === this.solicitudActual) {
        this.cargando.set(false);
      }
    }
  }

  private calcularPorcentaje(subtotalKg: number, totalKg: number): number {
    if (totalKg === 0) return 0;
    return Math.round((subtotalKg / totalKg) * 1000) / 10;
  }
}
