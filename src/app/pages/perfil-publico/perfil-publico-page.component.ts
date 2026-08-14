import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { CardStatComponent } from '../../shared/components/card-stat/card-stat.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PublicHeaderComponent } from '../../shared/components/public-header/public-header.component';
import { capitalizar, esCostaRica, nombrePais } from '../../shared/utils/empresa-catalogos.utils';
import { CompartirPerfilComponent } from './compartir-perfil/compartir-perfil.component';
import { EvolucionHuellaChartComponent } from './evolucion-huella-chart.component';
import {
  CertificacionPublica,
  EvolucionHuellaDTO,
  InsigniaEmpresa,
  PerfilPublicoDTO,
  PuntoHuella,
  RangoPeriodoHuella,
} from './perfil-publico.models';
import { PerfilPublicoService } from './perfil-publico.service';

interface RangoHuellaOption {
  valor: RangoPeriodoHuella;
  etiqueta: string;
}

const NIVEL_CLASES: Record<string, string> = {
  'sin nivel': 'sin-nivel',
  bronce: 'bronce',
  plata: 'plata',
  oro: 'oro',
  platino: 'platino',
};

const NIVELES_ORDEN = ['bronce', 'plata', 'oro', 'platino'];

const RANGOS_HUELLA: RangoHuellaOption[] = [
  { valor: 'ultimo_anio', etiqueta: '1A' },
  { valor: 'ultimos_3_anios', etiqueta: '3A' },
  { valor: 'historico', etiqueta: 'Todo' },
];

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  templateUrl: './perfil-publico-page.component.html',
  styleUrl: './perfil-publico-page.component.scss',
  imports: [
    RouterLink,
    IconComponent,
    CompartirPerfilComponent,
    BadgeComponent,
    CardComponent,
    CardStatComponent,
    PublicHeaderComponent,
    EvolucionHuellaChartComponent,
  ],
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
  protected huella = signal<EvolucionHuellaDTO | null>(null);
  protected huellaEstado = signal<'cargando' | 'exito' | 'error'>('cargando');
  protected rangoHuella = signal<RangoPeriodoHuella>('ultimos_3_anios');
  protected mensajeError = signal<string>('');
  protected mostrarCompartir = signal<boolean>(false);

  protected readonly nivelesOrden = NIVELES_ORDEN;
  protected readonly rangosHuella = RANGOS_HUELLA;

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
        this.cargarHuella(slug);
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.mensajeError.set(err.error?.mensaje ?? 'Perfil no encontrado.');
          this.estado.set('error404');
        } else {
          this.mensajeError.set(
            'No fue posible cargar el perfil en este momento. Intenta nuevamente mas tarde.'
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

  private cargarHuella(slug: string): void {
    this.huellaEstado.set('cargando');
    this.perfilService.obtenerEvolucionHuella(slug, this.rangoHuella()).subscribe({
      next: (huella) => {
        this.huella.set(huella);
        this.huellaEstado.set('exito');
      },
      error: () => {
        this.huella.set(null);
        this.huellaEstado.set('error');
      },
    });
  }

  protected cambiarRangoHuella(rango: RangoPeriodoHuella): void {
    if (this.rangoHuella() === rango) {
      return;
    }
    this.rangoHuella.set(rango);
    this.cargarHuella(this.slug);
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

  protected readonly nivelClase = computed(() => {
    const nivel = this.normalizarNivel(this.perfil()?.nivelEcologico).toLowerCase();
    return NIVEL_CLASES[nivel] ?? NIVEL_CLASES['sin nivel'];
  });

  protected readonly nivelIndex = computed(() => {
    const nivel = this.normalizarNivel(this.perfil()?.nivelEcologico).toLowerCase();
    const idx = NIVELES_ORDEN.indexOf(nivel);
    return idx >= 0 ? idx : -1;
  });

  protected readonly nivelNormalizado = computed(() => {
    return this.normalizarNivel(this.perfil()?.nivelEcologico);
  });

  protected normalizarNivel(nivel: string | null | undefined): string {
    if (!nivel || nivel.trim() === '') return 'Sin nivel';
    const limpio = nivel.trim().toLowerCase();
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
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

  protected formatToneladas(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 }).format(value);
  }

  protected formatVariacion(value: number | null | undefined): string {
    if (value === undefined || value === null) return 'Sin variacion';
    const prefijo = value > 0 ? '+' : '';
    return `${prefijo}${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 }).format(value)}%`;
  }

  protected ultimoPuntoHuella(): PuntoHuella | null {
    const serie = this.huella()?.serie ?? [];
    return serie.length ? serie[serie.length - 1] : null;
  }

  protected tendenciaLabel(): string {
    switch (this.huella()?.tendencia) {
      case 'reduccion':
        return 'Disminuyo';
      case 'aumento':
        return 'Aumento';
      default:
        return 'Se mantuvo';
    }
  }

  protected sectorFormateado(): string {
    return capitalizar(this.perfil()?.sectorIndustrial);
  }

  protected paisNombre(): string {
    return nombrePais(this.perfil()?.pais);
  }

  protected esPaisCostaRica(): boolean {
    return esCostaRica(this.perfil()?.pais);
  }

  protected getEstadoBadgeVariant(estado: string): BadgeVariant {
    switch (estado) {
      case 'ACTIVA':
        return 'success';
      case 'VENCIDA':
        return 'warning';
      case 'REVOCADA':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  protected getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'ACTIVA':
        return 'Vigente';
      case 'VENCIDA':
        return 'Vencida';
      case 'REVOCADA':
        return 'Revocada';
      default:
        return estado;
    }
  }

  protected esCertificacionActiva(estado: string): boolean {
    return estado === 'ACTIVA';
  }

  protected getAnioVigencia(): string {
    const fecha = this.perfil()?.fechaActualizacionNivel;
    if (!fecha) return '';
    return new Date(fecha).getFullYear().toString();
  }

  private actualizarMetaTags(dto: PerfilPublicoDTO, slug: string): void {
    this.titleService.setTitle(`${dto.nombreEmpresa} - Reputacion Ecologica | CarbonHub`);
    this.meta.updateTag({ property: 'og:title', content: dto.nombreEmpresa });
    this.meta.updateTag({
      property: 'og:description',
      content: `Perfil de reputacion ecologica de ${dto.nombreEmpresa} - Nivel ${dto.nivelEcologico}`,
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
