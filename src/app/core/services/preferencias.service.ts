import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Preferencias, PREFERENCIAS_POR_DEFECTO } from '../models/preferencias.model';
import { I18nService } from './i18n.service';

/**
 * Gestiona las preferencias de interfaz del usuario autenticado (PP-31):
 * lectura al iniciar sesión y actualización desde Configuración.
 */
@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  static readonly URL = '/api/usuarios/me/preferencias';

  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

  private readonly preferenciasActuales = signal<Preferencias>(PREFERENCIAS_POR_DEFECTO);

  /** Preferencias vigentes en la sesión (solo lectura). */
  readonly preferencias = this.preferenciasActuales.asReadonly();

  /**
   * Lee las preferencias del perfil (se invoca al iniciar sesión) y las
   * aplica de inmediato a la interfaz.
   */
  cargar(): Observable<Preferencias> {
    return this.http
      .get<Preferencias>(PreferenciasService.URL)
      .pipe(tap((preferencias) => this.aplicar(preferencias)));
  }

  /**
   * Persiste las preferencias en el perfil del usuario y, si el guardado es
   * exitoso, las aplica de inmediato a la interfaz.
   */
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
