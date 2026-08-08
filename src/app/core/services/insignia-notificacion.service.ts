import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { InsigniaEcoRuta } from '../models/insignia-ecoruta.model';
import { InsigniasEcoRutaService } from './insignias-ecoruta.service';

const REINTENTOS_MS = [1500, 3000, 5000];

/**
 * El otorgamiento de una insignia de EcoRuta corre en un hilo async del backend, disparado
 * después del commit de la generación del itinerario — no hay garantía de que ya esté persistida
 * cuando el frontend recibe la respuesta de `POST /ecoruta/itinerarios/generar`, y el DTO de
 * insignias no trae ningún flag de "nueva". Por eso esta clase compara un snapshot de antes
 * (`obtenerIdsActuales`, llamado justo antes de generar) contra uno de después, con reintentos.
 */
@Injectable({ providedIn: 'root' })
export class InsigniaNotificacionService {
  private readonly insigniasService = inject(InsigniasEcoRutaService);
  private readonly router = inject(Router);

  private readonly _pendientes = signal<InsigniaEcoRuta[]>([]);
  readonly pendientes = this._pendientes.asReadonly();

  /**
   * Se incrementa en cada `NavigationStart`. `revisarConReintentos` guarda el valor vigente al
   * arrancar y lo revalida antes de encolar una insignia nueva: si cambió, hubo una navegación
   * mientras el bucle de reintentos seguía en vuelo (hasta 9.5s: 1.5s + 3s + 5s) y el resultado
   * ya no aplica a la pantalla que lo originó, así que se descarta en silencio.
   */
  private tokenDeNavegacion = 0;

  constructor() {
    // Criterio de aceptación: se descarta todo al cambiar de ruta.
    this.router.events
      .pipe(filter((evento): evento is NavigationStart => evento instanceof NavigationStart))
      .subscribe(() => {
        this.tokenDeNavegacion++;
        this._pendientes.set([]);
      });
  }

  async obtenerIdsActuales(): Promise<ReadonlySet<number> | null> {
    try {
      const actuales = await firstValueFrom(this.insigniasService.listarObtenidas());
      return new Set(actuales.map((insignia) => insignia.idInsignia));
    } catch {
      // Un fallo acá no debe generar falsos positivos más adelante — se salta la revisión.
      return null;
    }
  }

  async revisarConReintentos(idsPrevios: ReadonlySet<number> | null): Promise<void> {
    if (idsPrevios === null) return;

    const tokenAlArrancar = this.tokenDeNavegacion;

    for (const esperaMs of REINTENTOS_MS) {
      await this.esperar(esperaMs);
      if (this.tokenDeNavegacion !== tokenAlArrancar) return; // hubo navegación: ya no aplica.
      try {
        const actuales = await firstValueFrom(this.insigniasService.listarObtenidas());
        if (this.tokenDeNavegacion !== tokenAlArrancar) return;
        const nuevas = actuales.filter((insignia) => !idsPrevios.has(insignia.idInsignia));
        if (nuevas.length > 0) {
          this._pendientes.update((actual) => [...actual, ...nuevas]);
          return;
        }
      } catch {
        // Un fallo de red durante un reintento tampoco interrumpe nada — sigue al próximo intento.
      }
    }
  }

  descartarActual(): void {
    this._pendientes.update((actual) => actual.slice(1));
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
