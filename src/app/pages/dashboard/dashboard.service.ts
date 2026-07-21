import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type EstadoComparacion = 'dentro' | 'cerca' | 'superado' | 'sin_limite';

export interface ComparacionEmisionesResponse {
  anio: number;
  huellaAcumuladaT: number;
  limiteT: number | null;
  porcentajeConsumido: number | null;
  estado: EstadoComparacion;
  mensaje: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/emisiones`;

  obtenerComparacion(anio: number): Observable<ComparacionEmisionesResponse> {
    const params = new HttpParams().set('anio', anio);
    return this.http.get<ComparacionEmisionesResponse>(`${this.baseUrl}/comparacion`, { params });
  }
}
