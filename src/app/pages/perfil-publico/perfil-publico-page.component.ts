import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';

import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { CompartirPerfilComponent } from './compartir-perfil/compartir-perfil.component';
import { CertificacionPublica, InsigniaEmpresa, PerfilPublicoDTO } from './perfil-publico.models';
import { PerfilPublicoService } from './perfil-publico.service';

interface NivelConfig {
  clase: string;
  icono: IconName;
  color: string;
}

const NIVEL_MAP: Record<string, NivelConfig> = {
  'sin nivel': { clase: 'sin-nivel', icono: 'leaf-off', color: '#6b7280' },
  bronce: { clase: 'bronce', icono: 'medal-bronze', color: '#cd7f32' },
  plata: { clase: 'plata', icono: 'medal-silver', color: '#9ca3af' },
  oro: { clase: 'oro', icono: 'medal-gold', color: '#d4a017' },
  platino: { clase: 'platino', icono: 'medal-platinum', color: '#2ba6de' },
};

const NIVELES_ORDEN = ['bronce', 'plata', 'oro', 'platino'];

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  templateUrl: './perfil-publico-page.component.html',
  styleUrl: './perfil-publico-page.component.scss',
  imports: [IconComponent, LogoComponent, CompartirPerfilComponent],
})
export class PerfilPublicoPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly perfilService = inject(PerfilPublicoService);
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  protected estado = signal<'cargando' | 'exito' | 'error404' | 'error500'>('cargando');
  protected perfil = signal<PerfilPublicoDTO | null>(null);
  protected certificaciones = signal<CertificacionPublica[]>([]);
  protected insignias = signal<InsigniaEmpresa[]>([]);
  protected mensajeError = signal<string>('');
  protected mostrarCompartir = signal<boolean>(false);

  protected readonly nivelesOrden = NIVELES_ORDEN;

  protected get slug(): string {
    return this.route.snapshot.paramMap.get('slug') ?? '';
  }

  constructor() {
    this.cargar();
    this.destroyRef.onDestroy(() => this.limpiarMetaTags());
  }

  protected cargar(): void {
    const slug = this.slug;
    this.estado.set('cargando');

    this.perfilService.obtenerPerfil(slug).subscribe({
      next: (dto) => {
        this.perfil.set(dto);
        this.estado.set('exito');
        this.actualizarMetaTags(dto, slug);
        this.cargarCertificaciones(slug);
        this.cargarInsignias(slug);
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.mensajeError.set(err.error?.mensaje ?? 'Perfil no encontrado.');
          this.estado.set('error404');
        } else {
          this.mensajeError.set(
            'No fue posible cargar el perfil en este momento. Intenta nuevamente más tarde.'
          );
          this.estado.set('error500');
        }
      },
    });
  }

  private cargarCertificaciones(slug: string): void {
    this.perfilService.listarCertificaciones(slug).subscribe({
      next: (certs) => this.certificaciones.set(certs),
      error: () => this.certificaciones.set([]),
    });
  }

  private cargarInsignias(slug: string): void {
    this.perfilService.listarInsignias(slug).subscribe({
      next: (ins) => this.insignias.set(ins),
      error: () => this.insignias.set([]),
    });
  }

  protected reintentar(): void {
    this.cargar();
  }

  protected toggleCompartir(): void {
    this.mostrarCompartir.update((v) => !v);
  }

  protected cerrarCompartir(): void {
    this.mostrarCompartir.set(false);
  }

  protected getNivelConfig(): NivelConfig {
    const nivel = (this.perfil()?.nivelEcologico ?? 'Sin nivel').toLowerCase();
    return NIVEL_MAP[nivel] ?? NIVEL_MAP['sin nivel'];
  }

  protected getNivelIndex(): number {
    const nivel = (this.perfil()?.nivelEcologico ?? 'sin nivel').toLowerCase();
    const idx = NIVELES_ORDEN.indexOf(nivel);
    return idx >= 0 ? idx : -1;
  }

  protected formatFechaActualizacion(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-CR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  protected formatFechaCorta(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  protected formatNumero(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('es-CR').format(value);
  }

  protected getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'ACTIVA':
        return 'badge--vigente';
      case 'VENCIDA':
        return 'badge--vencida';
      case 'REVOCADA':
        return 'badge--revocada';
      default:
        return 'badge--neutral';
    }
  }

  protected getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'ACTIVA':
        return 'VIGENTE';
      case 'VENCIDA':
        return 'VENCIDA';
      case 'REVOCADA':
        return 'REVOCADA';
      default:
        return estado;
    }
  }

  protected getAnioVigencia(): string {
    const fecha = this.perfil()?.fechaActualizacionNivel;
    if (!fecha) return new Date().getFullYear().toString();
    return new Date(fecha).getFullYear().toString();
  }

  private actualizarMetaTags(dto: PerfilPublicoDTO, slug: string): void {
    this.titleService.setTitle(`${dto.nombreEmpresa} — Reputación Ecológica | CarbonHub`);
    this.meta.updateTag({ property: 'og:title', content: dto.nombreEmpresa });
    this.meta.updateTag({
      property: 'og:description',
      content: `Perfil de reputación ecológica de ${dto.nombreEmpresa} — Nivel ${dto.nivelEcologico}`,
    });
    this.meta.updateTag({
      property: 'og:image',
      content: dto.logoUrl ?? '/assets/images/default-og-image.png',
    });
    this.meta.updateTag({
      property: 'og:url',
      content: `${window.location.origin}/empresa/${slug}/reputacion`,
    });
  }

  private limpiarMetaTags(): void {
    this.meta.removeTag("property='og:title'");
    this.meta.removeTag("property='og:description'");
    this.meta.removeTag("property='og:image'");
    this.meta.removeTag("property='og:url'");
  }
}
