import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { CertificacionesPublicasPageComponent } from './certificaciones/certificaciones-publicas-page.component';
import { PerfilPublicoDTO } from './perfil-publico.models';
import { PerfilPublicoService } from './perfil-publico.service';

export type SeccionActiva = 'certificaciones' | 'insignias' | 'evolucion';

interface NivelConfig {
  clase: string;
  icono: IconName;
}

const NIVEL_MAP: Record<string, NivelConfig> = {
  'Sin nivel': { clase: 'nivel--sin-nivel', icono: 'leaf-off' },
  Bronce: { clase: 'nivel--bronce', icono: 'medal-bronze' },
  Plata: { clase: 'nivel--plata', icono: 'medal-silver' },
  Oro: { clase: 'nivel--oro', icono: 'medal-gold' },
  Platino: { clase: 'nivel--platino', icono: 'medal-platinum' },
};

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  templateUrl: './perfil-publico-page.component.html',
  styleUrl: './perfil-publico-page.component.scss',
  imports: [IconComponent, CertificacionesPublicasPageComponent],
})
export class PerfilPublicoPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly perfilService = inject(PerfilPublicoService);

  protected estado = signal<'cargando' | 'exito' | 'error404' | 'error500'>('cargando');
  protected perfil = signal<PerfilPublicoDTO | null>(null);
  protected mensajeError = signal<string>('');
  protected seccionActiva = signal<SeccionActiva>('certificaciones');

  protected get slug(): string {
    return this.route.snapshot.paramMap.get('slug') ?? '';
  }

  constructor() {
    this.cargar();
  }

  protected cambiarSeccion(seccion: SeccionActiva): void {
    this.seccionActiva.set(seccion);
  }

  protected cargar(): void {
    const slug = this.slug;
    this.estado.set('cargando');

    this.perfilService.obtenerPerfil(slug).subscribe({
      next: (dto) => {
        this.perfil.set(dto);
        this.estado.set('exito');
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

  protected reintentar(): void {
    this.cargar();
  }

  protected getNivelConfig(): NivelConfig {
    const nivel = this.perfil()?.nivelEcologico ?? 'Sin nivel';
    return NIVEL_MAP[nivel] ?? NIVEL_MAP['Sin nivel'];
  }

  protected formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }

  protected formatNumero(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('es-CR').format(value);
  }

  protected get esSinNivel(): boolean {
    return this.perfil()?.nivelEcologico === 'Sin nivel';
  }
}
