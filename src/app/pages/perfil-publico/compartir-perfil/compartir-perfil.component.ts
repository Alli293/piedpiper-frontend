import { Component, OnInit, inject, input, signal } from '@angular/core';
import { EnlacePerfilDTO } from '../models/enlace-perfil.model';
import { PerfilPublicoService } from '../perfil-publico.service';

@Component({
  selector: 'app-compartir-perfil',
  standalone: true,
  imports: [],
  templateUrl: './compartir-perfil.component.html',
  styleUrl: './compartir-perfil.component.scss',
})
export class CompartirPerfilComponent implements OnInit {
  private readonly perfilService = inject(PerfilPublicoService);

  readonly slug = input.required<string>();

  protected readonly estado = signal<'cargando' | 'exito' | 'error'>('cargando');
  protected readonly enlace = signal<EnlacePerfilDTO | null>(null);
  protected readonly copiado = signal<'ninguno' | 'enlace' | 'codigo'>('ninguno');

  ngOnInit(): void {
    this.cargarEnlace();
  }

  protected reintentar(): void {
    this.cargarEnlace();
  }

  private cargarEnlace(): void {
    this.estado.set('cargando');
    this.enlace.set(null);

    this.perfilService.obtenerEnlaceComparticion(this.slug()).subscribe({
      next: (dto) => {
        this.enlace.set(dto);
        this.estado.set('exito');
      },
      error: () => {
        this.estado.set('error');
      },
    });
  }
}
