import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Preferencias, PREFERENCIAS_POR_DEFECTO } from '../models/preferencias.model';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  static readonly URL = '/api/usuarios/me/preferencias';

  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

  private readonly preferenciasActuales = signal<Preferencias>(PREFERENCIAS_POR_DEFECTO);

  readonly preferencias = this.preferenciasActuales.asReadonly();

  cargar(): Observable<Preferencias> {
    return this.http
      .get<Preferencias>(PreferenciasService.URL)
      .pipe(tap((preferencias) => this.aplicar(preferencias)));
  }

  actualizar(preferencias: Preferencias): Observable<Preferencias> {
    return this.http
      .put<Preferencias>(PreferenciasService.URL, preferencias)
      .pipe(tap((guardadas) => this.aplicar(guardadas)));
  }

  private aplicar(preferencias: Preferencias): void {
    this.preferenciasActuales.set(preferencias);
    this.i18n.usarIdioma(preferencias.idioma);
  }
}
