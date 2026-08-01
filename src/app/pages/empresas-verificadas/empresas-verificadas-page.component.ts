import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { firstValueFrom, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { BusquedaPerfilPublicoDTO, PageResponse } from '../perfil-publico/perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico/perfil-publico.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-empresas-verificadas-page',
  standalone: true,
  templateUrl: './empresas-verificadas-page.component.html',
  styleUrl: './empresas-verificadas-page.component.scss',
  imports: [RouterLink, IconComponent, LogoComponent],
})
export class EmpresasVerificadasPageComponent implements OnDestroy {
  private readonly perfilService = inject(PerfilPublicoService);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  protected termino = signal('');
  protected resultados = signal<BusquedaPerfilPublicoDTO[]>([]);
  protected cargando = signal(false);
  protected buscado = signal(false);
  protected error = signal<string | null>(null);

  private readonly searchSubject = new Subject<string>();
  private readonly subscription: Subscription;

  constructor() {
    this.titleService.setTitle('Empresas Verificadas | CarbonHub');

    // Cargar catálogo inicial (petición única → firstValueFrom)
    void this.cargarCatalogo();

    // Stream de búsqueda con debounce — catchError dentro del switchMap
    // para que un error no mate el observable y el buscador siga vivo.
    this.subscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          this.cargando.set(true);
          this.error.set(null);
          return this.perfilService.buscarEmpresas(term, 0, 12).pipe(
            catchError(() => {
              this.error.set('No se pudo completar la búsqueda. Intenta nuevamente.');
              this.cargando.set(false);
              return of({
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: 0,
              } as PageResponse<BusquedaPerfilPublicoDTO>);
            })
          );
        })
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
    this.error.set(null);
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

  /**
   * Carga inicial del catálogo — petición de una sola vez.
   * Usa firstValueFrom + try/catch según la convención del repo (CLAUDE.md).
   */
  private async cargarCatalogo(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const page = await firstValueFrom(this.perfilService.buscarEmpresas('', 0, 12));
      this.resultados.set(page.content);
    } catch {
      this.error.set('No se pudo cargar el catálogo de empresas. Intenta nuevamente.');
    } finally {
      this.cargando.set(false);
    }
  }
}
