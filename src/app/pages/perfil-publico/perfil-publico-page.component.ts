import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { PerfilPublicoDTO } from './perfil-publico.models';
import { PerfilPublicoService } from './perfil-publico.service';

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  templateUrl: './perfil-publico-page.component.html',
  styleUrl: './perfil-publico-page.component.scss',
  imports: [],
})
export class PerfilPublicoPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly perfilService = inject(PerfilPublicoService);

  protected estado = signal<'cargando' | 'exito' | 'error404' | 'error500'>('cargando');
  protected perfil = signal<PerfilPublicoDTO | null>(null);
  protected mensajeError = signal<string>('');

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
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
}
