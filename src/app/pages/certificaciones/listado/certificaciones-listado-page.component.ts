import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Certificacion, CertificacionResumen } from '../../../core/models/certificacion.model';
import { CertificacionesService } from '../../../core/services/certificaciones.service';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import {
  DetallePanelAccion,
  DetallePanelComponent,
  DetallePanelDato,
} from '../../../shared/components/detalle-panel/detalle-panel.component';
import { EncabezadoResumenComponent } from '../../../shared/components/encabezado-resumen/encabezado-resumen.component';
import {
  FilterChip,
  FilterChipsComponent,
} from '../../../shared/components/filter-chips/filter-chips.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { apiErrorMessage, apiErrorMessageAsync } from '../../../shared/utils/http-error.utils';

type FiltroVigencia = 'TODAS' | 'VIGENTE' | 'VENCIDA';

const ERROR_MENSAJE = 'No fue posible cargar las certificaciones en este momento.';
const ERROR_DETALLE_MENSAJE = 'No fue posible cargar esta certificación.';
const ERROR_DESCARGA_MENSAJE =
  'No fue posible descargar el archivo de verificación. Intenta nuevamente.';
const ORGANIZATION_NAME = 'CarbonHub';

@Component({
  selector: 'app-certificaciones-listado-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    DatePipe,
    DetallePanelComponent,
    EncabezadoResumenComponent,
    FilterChipsComponent,
    HeadingComponent,
    IconComponent,
    ModalComponent,
    ShellLayoutComponent,
  ],
  providers: [DatePipe],
  templateUrl: './certificaciones-listado-page.component.html',
  styleUrl: './certificaciones-listado-page.component.scss',
})
export class CertificacionesListadoPageComponent implements OnInit {
  private readonly certificacionesService = inject(CertificacionesService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);

  protected readonly certificaciones = signal<CertificacionResumen[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly filtro = signal<FiltroVigencia>('TODAS');
  protected readonly codigoCopiado = signal<string | null>(null);

  protected readonly detalleAbiertoId = signal<string | null>(null);
  protected readonly detalle = signal<Certificacion | null>(null);
  protected readonly cargandoDetalle = signal(false);
  protected readonly errorDetalle = signal(false);
  protected readonly descargandoJwt = signal(false);

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

    const idInicial = this.route.snapshot.queryParamMap.get('id');
    void this.cargarCertificaciones().then(() => {
      if (idInicial && this.certificaciones().some((cert) => cert.id === idInicial)) {
        this.abrirDetalle(idInicial);
      }
    });
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

  protected async copiarCodigo(codigo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigo);
      this.codigoCopiado.set(codigo);
      setTimeout(() => this.codigoCopiado.set(null), 2000);
    } catch {
      // Clipboard API no disponible o permiso denegado: no hay accion de respaldo posible.
    }
  }

  protected abrirDetalle(id: string): void {
    this.detalleAbiertoId.set(id);
    void this.cargarDetalle(id);
  }

  protected cerrarDetalle(): void {
    this.detalleAbiertoId.set(null);
    this.detalle.set(null);
    this.errorDetalle.set(false);
  }

  protected datoDetalle(cert: Certificacion): DetallePanelDato {
    return {
      icono: 'certificaciones',
      titulo: cert.nombreCertificacion,
      heroBadge: { etiqueta: this.etiquetaVigencia(cert), variant: this.varianteVigencia(cert) },
      eyebrow: 'Información de emisión',
      campos: [
        { icono: 'certificaciones', etiqueta: 'Certificación', valor: cert.nombreCertificacion },
        {
          icono: 'copiar',
          etiqueta: 'Código',
          valor: cert.codigoVerificacion ?? 'Sin código',
        },
        {
          icono: 'calendario',
          etiqueta: 'Emisión',
          valor: this.datePipe.transform(cert.fechaEmision, 'dd/MM/yyyy', 'UTC') ?? '',
        },
        {
          icono: 'calendario',
          etiqueta: 'Vencimiento',
          valor: this.datePipe.transform(cert.fechaVencimiento, 'dd/MM/yyyy', 'UTC') ?? '',
        },
        { icono: 'auditor', etiqueta: 'Auditor', valor: cert.nombreAuditor },
      ],
      credencial: {
        titulo: 'Credencial verificable',
        subtitulo: 'Estándar OpenBadges 3.0',
        descripcion:
          'Esta certificación es una credencial verificable. Comprueba su autenticidad e integridad con un verificador compatible con OpenBadges 3.0.',
      },
    };
  }

  protected accionesDetalle(cert: Certificacion): DetallePanelAccion[] {
    return [
      {
        id: 'descargar',
        etiqueta: 'Descargar (JWT)',
        icono: 'descargar',
        variant: 'secondary',
        loading: this.descargandoJwt(),
      },
      {
        id: 'verificar',
        etiqueta: 'Verificar',
        icono: 'redirect',
        variant: 'secondary',
        disabled: !cert.codigoVerificacion,
      },
      { id: 'compartir', etiqueta: 'Compartir', icono: 'linkedin', variant: 'primary' },
    ];
  }

  protected onAccionDetalle(id: string, cert: Certificacion): void {
    switch (id) {
      case 'descargar':
        void this.descargarVerificacionJwt(cert);
        break;
      case 'verificar':
        this.verificar(cert);
        break;
      case 'compartir':
        this.compartirEnLinkedIn(cert);
        break;
    }
  }

  private verificar(cert: Certificacion): void {
    if (cert.codigoVerificacion) {
      void this.router.navigate(['/verificar', cert.codigoVerificacion]);
    }
  }

  private async cargarDetalle(id: string): Promise<void> {
    this.cargandoDetalle.set(true);
    this.errorDetalle.set(false);
    try {
      const detalle = await firstValueFrom(this.certificacionesService.obtener(id));
      this.detalle.set(detalle);
    } catch (err: unknown) {
      this.detalle.set(null);
      this.errorDetalle.set(true);
      this.toastService.error(apiErrorMessage(err) ?? ERROR_DETALLE_MENSAJE);
    } finally {
      this.cargandoDetalle.set(false);
    }
  }

  private async descargarVerificacionJwt(cert: Certificacion): Promise<void> {
    this.descargandoJwt.set(true);
    try {
      const blob = await firstValueFrom(
        this.certificacionesService.descargarVerificacionJwt(cert.id)
      );
      this.descargarBlob(blob, `certificacion-${cert.id}.jwt`);
    } catch (error: unknown) {
      this.toastService.error((await apiErrorMessageAsync(error)) ?? ERROR_DESCARGA_MENSAJE);
    } finally {
      this.descargandoJwt.set(false);
    }
  }

  private compartirEnLinkedIn(cert: Certificacion): void {
    window.open(this.buildLinkedInShareUrl(cert), '_blank', 'noopener,noreferrer');
  }

  private buildLinkedInShareUrl(cert: Certificacion): string {
    const emision = new Date(cert.fechaEmision);
    const vencimiento = new Date(cert.fechaVencimiento);
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: cert.nombreCertificacion,
      organizationName: ORGANIZATION_NAME,
      certUrl: cert.urlVerificacion,
      issueYear: `${emision.getUTCFullYear()}`,
      issueMonth: `${emision.getUTCMonth() + 1}`,
      expirationYear: `${vencimiento.getUTCFullYear()}`,
      expirationMonth: `${vencimiento.getUTCMonth() + 1}`,
    });
    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  }

  private descargarBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
