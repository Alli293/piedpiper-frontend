import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import {
  FilterChip,
  FilterChipsComponent,
} from '../../../shared/components/filter-chips/filter-chips.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { AlertaVencimiento, UrgenciaVencimiento } from '../../dashboard/dashboard.model';
import { DashboardService } from '../../dashboard/dashboard.service';

type FiltroUrgencia = 'TODAS' | 'VENCIDAS' | 'URGENTES' | 'PROXIMAS';

const ERROR_MENSAJE = 'No fue posible cargar esta sección. Intenta recargar la página.';
const SIN_ALERTAS_MENSAJE = 'No hay alertas activas en este momento.';

const URGENCIA_A_FILTRO: Record<UrgenciaVencimiento, Exclude<FiltroUrgencia, 'TODAS'>> = {
  vencida: 'VENCIDAS',
  '7_dias': 'URGENTES',
  '30_dias': 'PROXIMAS',
  '90_dias': 'PROXIMAS',
};

const BADGE_POR_URGENCIA: Record<UrgenciaVencimiento, { variant: BadgeVariant; label: string }> = {
  vencida: { variant: 'danger', label: 'Vencida' },
  '7_dias': { variant: 'danger', label: 'Urgente · ≤7 d' },
  '30_dias': { variant: 'warning', label: 'Advertencia · 30 d' },
  '90_dias': { variant: 'info', label: 'Informativa · 90 d' },
};

/**
 * Centro de Alertas (PP-76): vista completa de "Alertas de vencimiento",
 * con filtro por urgencia y búsqueda por nombre, a la que enlazan el bloque
 * compacto y las tarjetas de "Estado de certificaciones" del dashboard.
 * Acepta un query param `filtro` (mismos valores que `FiltroUrgencia`) para
 * abrir la página con un chip preseleccionado.
 *
 * Reutiliza el mismo `GET /api/dashboard/alertas` que el bloque del
 * dashboard — no hay endpoint ni datos propios de esta pantalla.
 */
@Component({
  selector: 'app-centro-alertas-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    DatePipe,
    FilterChipsComponent,
    HeadingComponent,
    IconComponent,
    RouterLink,
    ShellLayoutComponent,
    TextInputComponent,
  ],
  templateUrl: './centro-alertas-page.component.html',
  styleUrl: './centro-alertas-page.component.scss',
})
export class CentroAlertasPageComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly route = inject(ActivatedRoute);

  protected readonly sinAlertasMensaje = SIN_ALERTAS_MENSAJE;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly alertas = signal<AlertaVencimiento[]>([]);
  protected readonly filtro = signal<FiltroUrgencia>(this.filtroInicial());
  protected readonly busqueda = signal('');

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'CERTIFICACIONES',
    pageTitle: 'Centro de Alertas',
    showNotificationDot: false,
    showBackButton: true,
  };

  protected readonly alertasOrdenadas = computed(() =>
    [...this.alertas()].sort((a, b) => a.diasRestantes - b.diasRestantes)
  );

  protected readonly conteos = computed(() => {
    const todas = this.alertasOrdenadas();
    return {
      TODAS: todas.length,
      VENCIDAS: todas.filter((a) => URGENCIA_A_FILTRO[a.urgencia] === 'VENCIDAS').length,
      URGENTES: todas.filter((a) => URGENCIA_A_FILTRO[a.urgencia] === 'URGENTES').length,
      PROXIMAS: todas.filter((a) => URGENCIA_A_FILTRO[a.urgencia] === 'PROXIMAS').length,
    };
  });

  protected readonly chips = computed<FilterChip[]>(() => {
    const n = this.conteos();
    return [
      { id: 'TODAS', label: 'Todas', count: n.TODAS },
      { id: 'VENCIDAS', label: 'Vencidas', count: n.VENCIDAS },
      { id: 'URGENTES', label: 'Urgentes', count: n.URGENTES },
      { id: 'PROXIMAS', label: 'Próximas', count: n.PROXIMAS },
    ];
  });

  protected readonly requierenAccionInmediata = computed(() => this.conteos().VENCIDAS);

  private readonly alertasFiltradasPorUrgencia = computed(() => {
    const filtro = this.filtro();
    const todas = this.alertasOrdenadas();
    if (filtro === 'TODAS') return todas;
    return todas.filter((a) => URGENCIA_A_FILTRO[a.urgencia] === filtro);
  });

  protected readonly alertasFiltradas = computed(() => {
    const termino = this.busqueda().trim().toLowerCase();
    const base = this.alertasFiltradasPorUrgencia();
    if (!termino) return base;
    return base.filter((a) => a.nombre.toLowerCase().includes(termino));
  });

  protected readonly vencidas = computed(() =>
    this.alertasFiltradas().filter((a) => a.urgencia === 'vencida')
  );

  protected readonly proximasAVencer = computed(() =>
    this.alertasFiltradas().filter((a) => a.urgencia !== 'vencida')
  );

  protected readonly sinResultados = computed(() => this.alertasFiltradas().length === 0);

  constructor() {
    void this.cargarAlertas();
  }

  protected seleccionarFiltro(id: string): void {
    this.filtro.set(esFiltroValido(id) ? id : 'TODAS');
  }

  private filtroInicial(): FiltroUrgencia {
    const filtro = this.route.snapshot.queryParamMap.get('filtro');
    return filtro && esFiltroValido(filtro) ? filtro : 'TODAS';
  }

  protected onBusquedaChange(valor: string): void {
    this.busqueda.set(valor);
  }

  protected badge(urgencia: UrgenciaVencimiento): { variant: BadgeVariant; label: string } {
    return BADGE_POR_URGENCIA[urgencia];
  }

  private async cargarAlertas(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const alertas = await firstValueFrom(this.dashboardService.obtenerAlertas());
      this.alertas.set(alertas);
    } catch (err: unknown) {
      this.alertas.set([]);
      this.error.set(apiErrorMessage(err) ?? ERROR_MENSAJE);
    } finally {
      this.cargando.set(false);
    }
  }
}

function esFiltroValido(id: string): id is FiltroUrgencia {
  return id === 'TODAS' || id === 'VENCIDAS' || id === 'URGENTES' || id === 'PROXIMAS';
}
