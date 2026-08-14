import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FiltroItinerarios,
  Itinerario,
  ItinerarioFavoritoResponse,
  PaginaItinerarios,
} from './models/itinerario.model';
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

  /**
   * Conversación continua de refinamiento del itinerario (PP-88). `request.contextoConversacional
   * .historialMensajes` es solo el historial *previo* a este mensaje — el mensaje actual va aparte,
   * en `request.mensajeUsuario`. No invertir el orden: el backend arma el prompt asumiendo que el
   * historial termina antes del turno que se está enviando ahora.
   */
  refinar(itinerarioId: string, request: RefinamientoRequest): Observable<RefinamientoResponse> {
    return this.http.post<RefinamientoResponse>(
      `${EcoRutaItinerariosService.URL}/${itinerarioId}/mensajes`,
      request
    );
  }

  /** Listado paginado de "Mis itinerarios" (PP-89). */
  listar(filtros: FiltroItinerarios = {}): Observable<PaginaItinerarios> {
    let params = new HttpParams().set('pagina', filtros.pagina ?? 1);
    if (filtros.soloFavoritos !== undefined) {
      params = params.set('soloFavoritos', filtros.soloFavoritos);
    }
    return this.http.get<PaginaItinerarios>(EcoRutaItinerariosService.URL, { params });
  }

  /** Actualiza el estado de favorito de un itinerario propio (PP-90). */
  actualizarFavorito(id: string, favorito: boolean): Observable<ItinerarioFavoritoResponse> {
    return this.http.put<ItinerarioFavoritoResponse>(
      `${EcoRutaItinerariosService.URL}/${id}/favorito`,
      { favorito }
    );
  }

  /** Eliminar itinerario (PP-89, fuera del AC — pedido explícito del equipo). */
  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${EcoRutaItinerariosService.URL}/${id}`);
  }
}
