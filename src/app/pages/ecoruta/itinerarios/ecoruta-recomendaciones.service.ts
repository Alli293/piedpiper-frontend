import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SustitucionRequest } from './models/alternativas.model';
import { Itinerario } from './models/itinerario.model';
import { RecomendacionesResponse } from './models/recomendaciones.model';

@Injectable({ providedIn: 'root' })
export class EcoRutaRecomendacionesService {
  static readonly URL = `${environment.apiBaseUrl}/ecoruta/itinerarios`;

  private readonly http = inject(HttpClient);

  obtenerRecomendaciones(itinerarioId: string): Observable<RecomendacionesResponse> {
    return this.http.get<RecomendacionesResponse>(
      `${EcoRutaRecomendacionesService.URL}/${itinerarioId}/recomendaciones`
    );
  }

  aplicarRecomendacion(
    itinerarioId: string,
    actividadId: string,
    body: SustitucionRequest
  ): Observable<Itinerario> {
    return this.http.put<Itinerario>(
      `${EcoRutaRecomendacionesService.URL}/${itinerarioId}/recomendaciones/${actividadId}/aplicar`,
      body
    );
  }
}
