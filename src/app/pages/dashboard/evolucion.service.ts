import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PuntoMensual {
  mes: number;
  totalCarbonKg: number;
}

export interface EvolucionMensualResponse {
  anio: number;
  serie: PuntoMensual[];
}

@Injectable({ providedIn: 'root' })
export class EvolucionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/emisiones`;

  obtenerEvolucion(anio: number): Observable<EvolucionMensualResponse> {
    const params = new HttpParams().set('anio', anio);
    return this.http.get<EvolucionMensualResponse>(`${this.baseUrl}/evolucion`, { params });
  }
}
