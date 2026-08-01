import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { BusquedaPerfilPublicoDTO, PageResponse } from '../perfil-publico.models';
import { PerfilPublicoService } from '../perfil-publico.service';

@Component({
  selector: 'app-busqueda-perfil',
  standalone: true,
  templateUrl: './busqueda-perfil.component.html',
  styleUrl: './busqueda-perfil.component.scss',
  imports: [],
})
export class BusquedaPerfilComponent implements OnDestroy {
  private readonly perfilService = inject(PerfilPublicoService);
  private readonly router = inject(Router);

  protected termino = signal('');
  protected resultados = signal<BusquedaPerfilPublicoDTO[]>([]);
  protected cargando = signal(false);
  protected buscado = signal(false);

  private readonly searchSubject = new Subject<string>();
  private readonly subscription: Subscription;

  constructor() {
    this.subscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (term.length < 3) {
            this.cargando.set(false);
            return of({
              content: [],
              totalElements: 0,
              totalPages: 0,
              number: 0,
              size: 0,
            } as PageResponse<BusquedaPerfilPublicoDTO>);
          }
          this.cargando.set(true);
          return this.perfilService.buscarEmpresas(term);
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
    this.searchSubject.next(value);
  }

  protected seleccionar(dto: BusquedaPerfilPublicoDTO): void {
    this.router.navigate(['/empresa', dto.slug, 'reputacion']);
  }

  protected highlight(text: string): string {
    const term = this.termino();
    if (!term || term.length < 3) return text;
    const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
