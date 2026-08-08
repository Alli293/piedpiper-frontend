import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import {
  CertificacionPublica,
  EvolucionHuellaPublica,
  InsigniaEmpresa,
  PerfilPublicoDTO,
} from './perfil-publico.models';
import { PerfilPublicoService } from './perfil-publico.service';

interface NivelConfig {
  clase: string;
  icono: IconName;
  color: string;
}

const NIVEL_MAP: Record<string, NivelConfig> = {
  'Sin nivel': { clase: 'sin-nivel', icono: 'leaf-off', color: '#6b7280' },
  Bronce: { clase: 'bronce', icono: 'medal-bronze', color: '#cd7f32' },
  Plata: { clase: 'plata', icono: 'medal-silver', color: '#9ca3af' },
  Oro: { clase: 'oro', icono: 'medal-gold', color: '#d4a017' },
  Platino: { clase: 'platino', icono: 'medal-platinum', color: '#2ba6de' },
};

const NIVELES_ORDEN = ['Bronce', 'Plata', 'Oro', 'Platino'];

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip
);

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  templateUrl: './perfil-publico-page.component.html',
  styleUrl: './perfil-publico-page.component.scss',
  imports: [IconComponent, LogoComponent, DecimalPipe, BaseChartDirective],
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
  protected evolucion = signal<EvolucionHuellaPublica | null>(null);
  protected mensajeError = signal<string>('');

  protected readonly maxTco2e = computed(() => {
    const ev = this.evolucion();
    if (!ev || ev.serie.length === 0) return 1;
    return Math.max(...ev.serie.map((p) => p.totalTco2e), 0.001);
  });

  protected readonly chartData = computed(() => {
    const ev = this.evolucion();
    if (!ev || ev.serie.length === 0) return { labels: [], datasets: [] };
    return {
      labels: ev.serie.map((p) => p.anio.toString()),
      datasets: [
        {
          data: ev.serie.map((p) => p.totalTco2e),
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#16a34a',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  });

  protected readonly chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `${ctx.parsed.y.toFixed(3)} tCO₂e`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          font: { size: 11 },
          callback: (value: string | number) => `${value}`,
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: 'bold' as const } },
      },
    },
  }));

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
        this.cargarEvolucion(slug);
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

  private cargarEvolucion(slug: string): void {
    this.perfilService.obtenerEvolucionHuella(slug).subscribe({
      next: (ev) => this.evolucion.set(ev),
      error: () => this.evolucion.set(null),
    });
  }

  protected reintentar(): void {
    this.cargar();
  }

  protected readonly nivelConfig = computed(() => {
    const nivel = this.normalizarNivel(this.perfil()?.nivelEcologico);
    return NIVEL_MAP[nivel] ?? NIVEL_MAP['Sin nivel'];
  });

  protected readonly nivelIndex = computed(() => {
    const nivel = this.normalizarNivel(this.perfil()?.nivelEcologico);
    const idx = NIVELES_ORDEN.indexOf(nivel);
    return idx >= 0 ? idx : -1;
  });

  protected readonly nivelNormalizado = computed(() => {
    return this.normalizarNivel(this.perfil()?.nivelEcologico);
  });

  protected formatFechaActualizacion(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-CR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Normaliza el nivel ecológico del backend (que puede venir en mayúsculas: "ORO")
   * al formato que usa el frontend ("Oro") para las clases CSS y el mapa de configuración.
   */
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
