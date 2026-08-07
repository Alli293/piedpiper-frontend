import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ComparacionResponse, SustitucionRequest } from './models/alternativas.model';
import { Itinerario } from './models/itinerario.model';

@Injectable({ providedIn: 'root' })
export class EcoRutaAlternativasService {
  static readonly URL = `${environment.apiBaseUrl}/ecoruta/itinerarios`;

  private readonly http = inject(HttpClient);

  obtenerAlternativas(itinerarioId: string, actividadId: string): Observable<ComparacionResponse> {
    return this.http.get<ComparacionResponse>(
      `${EcoRutaAlternativasService.URL}/${itinerarioId}/actividades/${actividadId}/alternativas`
    );
  }

  sustituirActividad(itinerarioId: string, actividadId: string, body: SustitucionRequest): Observable<Itinerario> {
    return this.http.put<Itinerario>(
      `${EcoRutaAlternativasService.URL}/${itinerarioId}/actividades/${actividadId}/sustituir`,
      body
    );
  }
}
