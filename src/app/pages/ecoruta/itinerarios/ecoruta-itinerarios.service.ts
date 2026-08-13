import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FiltroItinerarios, Itinerario, PaginaItinerarios } from './models/itinerario.model';
import { RefinamientoRequest, RefinamientoResponse } from './models/refinamiento.model';

@Injectable({ providedIn: 'root' })
export class EcoRutaItinerariosService {
  static readonly URL = `${environment.apiBaseUrl}/ecoruta/itinerarios`;

  private readonly http = inject(HttpClient);

  generar(): Observable<Itinerario> {
    return this.http.post<Itinerario>(`${EcoRutaItinerariosService.URL}/generar`, {});
  }

  obtener(id: string): Observable<Itinerario> {
    return this.http.get<Itinerario>(`${EcoRutaItinerariosService.URL}/${id}`);
  }

  /** Conversación continua de refinamiento del itinerario (PP-88). */
  refinar(itinerarioId: string, request: RefinamientoRequest): Observable<RefinamientoResponse> {
    return this.http.post<RefinamientoResponse>(
      `${EcoRutaItinerariosService.URL}/${itinerarioId}/mensajes`,
      request
    );
  }

  /** Listado paginado de "Mis itinerarios" (PP-89). */
  listar(filtros: FiltroItinerarios = {}): Observable<PaginaItinerarios> {
    const params = new HttpParams().set('pagina', filtros.pagina ?? 1);
    return this.http.get<PaginaItinerarios>(EcoRutaItinerariosService.URL, { params });
  }

  /** Eliminar itinerario (PP-89, fuera del AC — pedido explícito del equipo). */
  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${EcoRutaItinerariosService.URL}/${id}`);
  }
}
