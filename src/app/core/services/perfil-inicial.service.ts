import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { PerfilInicial, PerfilInicialRequest } from '../models/perfil-inicial.model';

@Injectable({ providedIn: 'root' })
export class PerfilInicialService {
  static readonly URL = '/api/usuarios/me/perfil-inicial';

  private readonly http = inject(HttpClient);
  private readonly perfilSignal = signal<PerfilInicial | null>(null);
  private peticionEnCurso: Observable<PerfilInicial> | null = null;

  /** Último perfil cargado, disponible de forma síncrona mientras dure la sesión. */
  readonly perfil = this.perfilSignal.asReadonly();

  obtener(): Observable<PerfilInicial> {
    if (!this.peticionEnCurso) {
      this.peticionEnCurso = this.http.get<PerfilInicial>(PerfilInicialService.URL).pipe(
        tap((perfil) => this.perfilSignal.set(perfil)),
        shareReplay(1)
      );
    }
    return this.peticionEnCurso;
  }

  completar(request: PerfilInicialRequest): Observable<PerfilInicial> {
    return this.http
      .put<PerfilInicial>(PerfilInicialService.URL, request)
      .pipe(tap((perfil) => this.perfilSignal.set(perfil)));
  }

  /** Descarta el perfil y la petición en curso; se usa al cambiar de sesión. */
  limpiarCache(): void {
    this.perfilSignal.set(null);
    this.peticionEnCurso = null;
  }
}
