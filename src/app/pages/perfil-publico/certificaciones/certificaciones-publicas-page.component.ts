import { DatePipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
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
import { StateLayoutComponent } from '../../../shared/layouts/state-layout/state-layout.component';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { CertificacionPublica, PerfilPublicoDTO } from '../perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico.service';
import { PerfilPublicoSeccionHeaderComponent } from '../shared/perfil-publico-seccion-header.component';

type FiltroEstado = 'TODAS' | 'ACTIVA' | 'VENCIDA' | 'REVOCADA';

export const MENSAJE_NO_ENCONTRADO = 'El perfil que buscas no existe o ya no está disponible.';
export const MENSAJE_ERROR_CERTIFICACIONES =
  'No fue posible cargar las certificaciones en este momento.';

const ESTADOS: Record<string, { etiqueta: string; variante: BadgeVariant }> = {
  ACTIVA: { etiqueta: 'Vigente', variante: 'success' },
  VENCIDA: { etiqueta: 'Vencida', variante: 'warning' },
  REVOCADA: { etiqueta: 'Revocada', variante: 'danger' },
};

@Component({
  selector: 'app-certificaciones-publicas-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    DatePipe,
    FilterChipsComponent,
    HeadingComponent,
    IconComponent,
    PerfilPublicoSeccionHeaderComponent,
    StateLayoutComponent,
  ],
  templateUrl: './certificaciones-publicas-page.component.html',
  styleUrl: './certificaciones-publicas-page.component.scss',
})
export class CertificacionesPublicasPageComponent implements OnInit {
  private readonly perfilPublicoService = inject(PerfilPublicoService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly slug = input.required<string>();

  protected readonly certificaciones = signal<CertificacionPublica[]>([]);
  protected readonly perfil = signal<PerfilPublicoDTO | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly noEncontrado = signal(false);
  protected readonly errorMensaje = signal(MENSAJE_ERROR_CERTIFICACIONES);
  protected readonly filtroEstado = signal<FiltroEstado>('TODAS');
  protected readonly noEncontradoMensaje = MENSAJE_NO_ENCONTRADO;
  protected readonly codigoCopiado = signal<string | null>(null);

  private cargaRequestId = 0;

  protected readonly conteos = computed(() => {
    const todas = this.certificaciones();
    return {
      TODAS: todas.length,
      ACTIVA: todas.filter((cert) => cert.estado === 'ACTIVA').length,
      VENCIDA: todas.filter((cert) => cert.estado === 'VENCIDA').length,
      REVOCADA: todas.filter((cert) => cert.estado === 'REVOCADA').length,
    };
  });

  protected readonly chipsEstado = computed<FilterChip[]>(() => {
    const n = this.conteos();
    return [
      { id: 'TODAS', label: 'Todas', count: n.TODAS },
      { id: 'ACTIVA', label: 'Vigentes', count: n.ACTIVA },
      { id: 'VENCIDA', label: 'Vencidas', count: n.VENCIDA },
      { id: 'REVOCADA', label: 'Revocadas', count: n.REVOCADA },
    ];
  });

  protected readonly certificacionesFiltradas = computed(() => {
    const filtro = this.filtroEstado();
    return filtro === 'TODAS'
      ? this.certificaciones()
      : this.certificaciones().filter((cert) => cert.estado === filtro);
  });

  ngOnInit(): void {
    void this.cargarCertificaciones();
    void this.cargarPerfil();
  }

  protected seleccionarFiltro(id: string): void {
    this.filtroEstado.set(esFiltroEstadoValido(id) ? id : 'TODAS');
  }

  protected verTodas(): void {
    this.filtroEstado.set('TODAS');
  }

  protected reintentar(): void {
    void this.cargarCertificaciones();
  }

  protected volver(): void {
    this.location.back();
  }

  protected etiqueta(estado: string): string {
    return ESTADOS[estado]?.etiqueta ?? 'No disponible';
  }

  protected variante(estado: string): BadgeVariant {
    return ESTADOS[estado]?.variante ?? 'neutral';
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

  protected verificar(codigoVerificacion: string): void {
    void this.router.navigate(['/verificar', codigoVerificacion]);
  }

  private async cargarPerfil(): Promise<void> {
    try {
      const perfil = await firstValueFrom(this.perfilPublicoService.obtenerPerfil(this.slug()));
      this.perfil.set(perfil);
    } catch {
      // El encabezado degrada a su variante generica; no afecta el resto de la pagina.
    }
  }

  private async cargarCertificaciones(): Promise<void> {
    const requestId = ++this.cargaRequestId;
    this.cargando.set(true);
    this.error.set(false);
    this.noEncontrado.set(false);
    try {
      const certificaciones = await firstValueFrom(
        this.perfilPublicoService.listarCertificaciones(this.slug())
      );
      if (requestId !== this.cargaRequestId) return;
      this.certificaciones.set(certificaciones);
    } catch (err: unknown) {
      if (requestId !== this.cargaRequestId) return;
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.noEncontrado.set(true);
      } else {
        this.errorMensaje.set(apiErrorMessage(err) ?? MENSAJE_ERROR_CERTIFICACIONES);
        this.error.set(true);
      }
    } finally {
      if (requestId === this.cargaRequestId) {
        this.cargando.set(false);
      }
    }
  }
}

function esFiltroEstadoValido(valor: string): valor is FiltroEstado {
  return valor === 'TODAS' || valor === 'ACTIVA' || valor === 'VENCIDA' || valor === 'REVOCADA';
}
