import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { BusquedaPerfilPublicoDTO, PageResponse } from '../perfil-publico/perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico/perfil-publico.service';

@Component({
  selector: 'app-empresas-verificadas-page',
  standalone: true,
  templateUrl: './empresas-verificadas-page.component.html',
  styleUrl: './empresas-verificadas-page.component.scss',
  imports: [RouterLink],
})
export class EmpresasVerificadasPageComponent implements OnDestroy {
  private readonly perfilService = inject(PerfilPublicoService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  protected termino = signal('');
  protected resultados = signal<BusquedaPerfilPublicoDTO[]>([]);
  protected cargando = signal(false);
  protected buscado = signal(false);

  private readonly searchSubject = new Subject<string>();
  private readonly subscription: Subscription;

  constructor() {
    this.titleService.setTitle('Empresas Verificadas | CarbonHub');

    // Cargar catálogo inicial (empresas activas sin filtro)
    this.cargarCatalogo();

    this.subscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.cargando.set(true);
          return this.perfilService.buscarEmpresas(term, 0, 12);
        }),
      )
      .subscribe((page) => {
        this.resultados.set(page.content);
        this.cargando.set(false);
        this.buscado.set(true);
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.searchSubject.complete();
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.termino.set(value);
    this.searchSubject.next(value);
  }

  protected verPerfil(empresa: BusquedaPerfilPublicoDTO): void {
    this.router.navigate(['/empresa', empresa.slug, 'reputacion']);
  }

  protected getNivelClase(nivel: string): string {
    const mapa: Record<string, string> = {
      'Sin nivel': 'sin-nivel',
      Bronce: 'bronce',
      Plata: 'plata',
      Oro: 'oro',
      Platino: 'platino',
    };
    return mapa[nivel] ?? 'sin-nivel';
  }

  private cargarCatalogo(): void {
    this.cargando.set(true);
    this.perfilService.buscarEmpresas('', 0, 12).subscribe({
      next: (page) => {
        this.resultados.set(page.content);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }
}
