import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CertificacionResumen } from '../../../core/models/certificacion.model';
import { CertificacionesService } from '../../../core/services/certificaciones.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import {
  FilterChip,
  FilterChipsComponent,
} from '../../../shared/components/filter-chips/filter-chips.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { LinkDirective } from '../../../shared/components/link/link.directive';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';

type FiltroVigencia = 'TODAS' | 'VIGENTE' | 'VENCIDA';

const ERROR_MENSAJE = 'No fue posible cargar las certificaciones en este momento.';

@Component({
  selector: 'app-certificaciones-listado-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    DatePipe,
    FilterChipsComponent,
    HeadingComponent,
    IconComponent,
    LinkDirective,
    RouterLink,
    ShellLayoutComponent,
  ],
  templateUrl: './certificaciones-listado-page.component.html',
  styleUrl: './certificaciones-listado-page.component.scss',
})
export class CertificacionesListadoPageComponent implements OnInit {
  private readonly certificacionesService = inject(CertificacionesService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly certificaciones = signal<CertificacionResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly filtro = signal<FiltroVigencia>('TODAS');

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'CERTIFICACIONES',
    pageTitle: 'Mis certificaciones',
    showNotificationDot: true,
    showBackButton: true,
  }));

  // "Vencida" no es un estado del backend (hoy `estado` solo tiene ACTIVA):
  // se filtra por `vigente`, que compara fechaVencimiento contra hoy.
  protected readonly conteos = computed(() => {
    const todas = this.certificaciones();
    return {
      TODAS: todas.length,
      VIGENTE: todas.filter((cert) => cert.vigente).length,
      VENCIDA: todas.filter((cert) => !cert.vigente).length,
    };
  });

  protected readonly chipsVigencia = computed<FilterChip[]>(() => {
    const n = this.conteos();
    return [
      { id: 'TODAS', label: 'Todas', count: n.TODAS },
      { id: 'VIGENTE', label: 'Vigentes', count: n.VIGENTE },
      { id: 'VENCIDA', label: 'Vencidas', count: n.VENCIDA },
    ];
  });

  protected readonly certificacionesFiltradas = computed(() => {
    const filtro = this.filtro();
    const todas = this.certificaciones();
    if (filtro === 'VIGENTE') return todas.filter((cert) => cert.vigente);
    if (filtro === 'VENCIDA') return todas.filter((cert) => !cert.vigente);
    return todas;
  });

  ngOnInit(): void {
    const estado = this.route.snapshot.queryParamMap.get('estado');
    const filtroInicial = mapEstadoAFiltro(estado);
    if (filtroInicial) this.filtro.set(filtroInicial);
    void this.cargarCertificaciones();
  }

  protected seleccionarFiltro(id: string): void {
    this.filtro.set(esFiltroValido(id) ? id : 'TODAS');
  }

  protected verTodas(): void {
    this.filtro.set('TODAS');
  }

  protected reintentar(): void {
    void this.cargarCertificaciones();
  }

  protected etiquetaVigencia(cert: CertificacionResumen): string {
    return cert.vigente ? 'Vigente' : 'Vencida';
  }

  protected varianteVigencia(cert: CertificacionResumen): BadgeVariant {
    return cert.vigente ? 'success' : 'warning';
  }

  private async cargarCertificaciones(): Promise<void> {
    this.cargando.set(true);
    this.error.set(false);
    try {
      const certificaciones = await firstValueFrom(this.certificacionesService.listar());
      this.certificaciones.set(certificaciones);
    } catch (err: unknown) {
      this.error.set(true);
      this.toastService.error(apiErrorMessage(err) ?? ERROR_MENSAJE);
    } finally {
      this.cargando.set(false);
    }
  }
}

function esFiltroValido(valor: string): valor is FiltroVigencia {
  return valor === 'TODAS' || valor === 'VIGENTE' || valor === 'VENCIDA';
}

// Mapea el `estado` que envía el panel "Estado de certificaciones" del
// dashboard (activa | proxima_a_vencer | vencida) al filtro de vigencia que
// soporta este listado. `proxima_a_vencer` NO se mapea a propósito: este
// listado aun no tiene un chip para esa noción, y agruparla bajo VIGENTE
// hacía que la tarjeta prometiera un filtro que no cumplía (ver comentarios
// de PR #74). Mientras ese chip no exista, esa tarjeta no es un enlace
// (`estado-certificaciones-panel`), así que este caso no debería llegar
// nunca en la práctica; se deja el fallback a TODAS por seguridad.
function mapEstadoAFiltro(estado: string | null): FiltroVigencia | null {
  switch (estado) {
    case 'activa':
      return 'VIGENTE';
    case 'vencida':
      return 'VENCIDA';
    default:
      return null;
  }
}
