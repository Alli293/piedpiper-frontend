import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CertificacionResumen } from '../../../core/models/certificacion.model';
import { CertificacionesService } from '../../../core/services/certificaciones.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { EncabezadoResumenComponent } from '../../../shared/components/encabezado-resumen/encabezado-resumen.component';
import {
  FilterChip,
  FilterChipsComponent,
} from '../../../shared/components/filter-chips/filter-chips.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { AlertaVencimiento, UrgenciaVencimiento } from '../../dashboard/dashboard.model';
import { DashboardService } from '../../dashboard/dashboard.service';

/**
 * Alerta con el código de verificación de su certificación ya resuelto. El
 * backend no lo trae en `AlertaVencimientoResponseDTO` a propósito (es dueño
 * `CertificacionResumenResponseDTO`); esta vista lo cruza en el cliente por
 * `idCertificacion` contra `GET /api/certificaciones`.
 */
type AlertaConCodigo = AlertaVencimiento & { codigoVerificacion: string | null };

type FiltroUrgencia = 'TODAS' | 'VENCIDAS' | 'URGENTES' | 'PROXIMAS' | 'INFORMATIVAS';

const ERROR_MENSAJE = 'No fue posible cargar esta sección. Intenta recargar la página.';
const SIN_ALERTAS_MENSAJE =
  'No hay alertas activas en este momento. Cuando una de tus certificaciones se acerque a su vencimiento, aparecerá aquí ordenada por urgencia.';
const SIN_COINCIDENCIAS_MENSAJE = 'Ninguna alerta coincide con tu búsqueda o filtro actual.';

const URGENCIA_A_FILTRO: Record<UrgenciaVencimiento, Exclude<FiltroUrgencia, 'TODAS'>> = {
  vencida: 'VENCIDAS',
  '7_dias': 'URGENTES',
  '30_dias': 'PROXIMAS',
  '90_dias': 'INFORMATIVAS',
};

const BADGE_POR_URGENCIA: Record<UrgenciaVencimiento, { variant: BadgeVariant; label: string }> = {
  vencida: { variant: 'danger-solid', label: 'Vencida' },
  '7_dias': { variant: 'danger', label: 'Urgente · ≤7 d' },
  '30_dias': { variant: 'warning', label: 'Próxima a vencer · 30 d' },
  '90_dias': { variant: 'info', label: 'Informativa · 90 d' },
};

const CLASE_FILA_POR_URGENCIA: Record<UrgenciaVencimiento, string> = {
  vencida: 'vencida',
  '7_dias': 'urgente',
  '30_dias': 'proxima',
  '90_dias': 'informativa',
};

// Mismos íconos que las tarjetas de "Estado de certificaciones" del
// dashboard (ver estado-certificaciones-panel.component.ts), para que ambas
// vistas se lean como el mismo sistema visual.
const ICONO_POR_URGENCIA: Record<UrgenciaVencimiento, IconName> = {
  vencida: 'danger-solido',
  '7_dias': 'danger-solido',
  '30_dias': 'vencida',
  '90_dias': 'info',
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
    EncabezadoResumenComponent,
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
  private readonly certificacionesService = inject(CertificacionesService);
  private readonly route = inject(ActivatedRoute);

  protected readonly sinAlertasMensaje = SIN_ALERTAS_MENSAJE;
  protected readonly sinCoincidenciasMensaje = SIN_COINCIDENCIAS_MENSAJE;

  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly alertas = signal<AlertaVencimiento[]>([]);
  protected readonly certificaciones = signal<CertificacionResumen[]>([]);
  protected readonly filtro = signal<FiltroUrgencia>(this.filtroInicial());
  protected readonly busqueda = signal('');
  protected readonly codigoCopiado = signal<string | null>(null);

  protected readonly headerConfig: HeaderConfig = {
    sectionLabel: 'CERTIFICACIONES',
    pageTitle: 'Centro de Alertas',
    showBackButton: true,
  };

  private readonly codigoPorCertificacion = computed(() => {
    const mapa = new Map<string, string | null>();
    for (const cert of this.certificaciones()) {
      mapa.set(cert.id, cert.codigoVerificacion);
    }
    return mapa;
  });

  private readonly alertasConCodigo = computed<AlertaConCodigo[]>(() => {
    const mapa = this.codigoPorCertificacion();
    return this.alertas().map((alerta) => ({
      ...alerta,
      codigoVerificacion: mapa.get(alerta.idCertificacion) ?? null,
    }));
  });

  protected readonly alertasOrdenadas = computed(() =>
    [...this.alertasConCodigo()].sort((a, b) => a.diasRestantes - b.diasRestantes)
  );

  protected readonly conteos = computed(() => {
    const todas = this.alertasOrdenadas();
    return {
      TODAS: todas.length,
      VENCIDAS: todas.filter((a) => URGENCIA_A_FILTRO[a.urgencia] === 'VENCIDAS').length,
      URGENTES: todas.filter((a) => URGENCIA_A_FILTRO[a.urgencia] === 'URGENTES').length,
      PROXIMAS: todas.filter((a) => URGENCIA_A_FILTRO[a.urgencia] === 'PROXIMAS').length,
      INFORMATIVAS: todas.filter((a) => URGENCIA_A_FILTRO[a.urgencia] === 'INFORMATIVAS').length,
    };
  });

  protected readonly chips = computed<FilterChip[]>(() => {
    const n = this.conteos();
    return [
      { id: 'TODAS', label: 'Todas', count: n.TODAS },
      { id: 'VENCIDAS', label: 'Vencidas', count: n.VENCIDAS },
      { id: 'URGENTES', label: 'Urgentes', count: n.URGENTES },
      { id: 'PROXIMAS', label: 'Próximas', count: n.PROXIMAS },
      { id: 'INFORMATIVAS', label: 'Informativas', count: n.INFORMATIVAS },
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

  protected readonly urgentes = computed(() =>
    this.alertasFiltradas().filter((a) => a.urgencia === '7_dias')
  );

  protected readonly proximasAVencer = computed(() =>
    this.alertasFiltradas().filter((a) => a.urgencia === '30_dias')
  );

  protected readonly informativas = computed(() =>
    this.alertasFiltradas().filter((a) => a.urgencia === '90_dias')
  );

  /** Genuinamente no hay alertas: se ignoran filtro/búsqueda. */
  protected readonly sinAlertas = computed(() => this.alertas().length === 0);

  /** Hay alertas, pero el filtro/búsqueda actual no encuentra ninguna. */
  protected readonly sinCoincidencias = computed(
    () => this.alertas().length > 0 && this.alertasFiltradas().length === 0
  );

  constructor() {
    void this.cargarAlertas();
    void this.cargarCertificaciones();
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

  protected limpiarFiltros(): void {
    this.filtro.set('TODAS');
    this.busqueda.set('');
  }

  protected badge(urgencia: UrgenciaVencimiento): { variant: BadgeVariant; label: string } {
    return BADGE_POR_URGENCIA[urgencia];
  }

  protected claseFila(urgencia: UrgenciaVencimiento): string {
    return CLASE_FILA_POR_URGENCIA[urgencia];
  }

  protected iconoFila(urgencia: UrgenciaVencimiento): IconName {
    return ICONO_POR_URGENCIA[urgencia];
  }

  protected async copiarCodigo(codigo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigo);
      this.codigoCopiado.set(codigo);
      setTimeout(() => this.codigoCopiado.set(null), 2000);
    } catch {
      // Clipboard API no disponible o permiso denegado: no hay accion de respaldo posible.
    }
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

  // El codigo de verificacion no es parte de AlertaVencimientoResponseDTO
  // (ver AlertaConCodigo): se resuelve por separado contra
  // /api/certificaciones y sin bloquear cargarAlertas() si esta consulta
  // falla.
  private async cargarCertificaciones(): Promise<void> {
    try {
      const certificaciones = await firstValueFrom(this.certificacionesService.listar());
      this.certificaciones.set(certificaciones);
    } catch {
      this.certificaciones.set([]);
    }
  }
}

function esFiltroValido(id: string): id is FiltroUrgencia {
  return (
    id === 'TODAS' ||
    id === 'VENCIDAS' ||
    id === 'URGENTES' ||
    id === 'PROXIMAS' ||
    id === 'INFORMATIVAS'
  );
}
