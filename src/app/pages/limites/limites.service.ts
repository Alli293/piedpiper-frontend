import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LimiteEmisionesRequest {
  anio: number;
  limiteMt: number;
  justificacion: string | null;
}

export interface LimiteEmisionesResponse {
  id: number;
  empresaId: string;
  anio: number;
  limiteMt: number;
  justificacion: string | null;
  mensaje: string | null;
  actualizadoEn: string | null;
  recienCreada: boolean;
}

@Injectable({ providedIn: 'root' })
export class LimitesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/limites`;

  obtenerLimite(anio: number): Observable<LimiteEmisionesResponse> {
    return this.http.get<LimiteEmisionesResponse>(`${this.apiUrl}/${anio}`);
  }

  listarLimites(): Observable<LimiteEmisionesResponse[]> {
    return this.http.get<LimiteEmisionesResponse[]>(this.apiUrl);
  }

  guardarLimite(request: LimiteEmisionesRequest): Observable<LimiteEmisionesResponse> {
    return this.http.post<LimiteEmisionesResponse>(this.apiUrl, request);
  }

  eliminarLimite(anio: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${anio}`);
  }
}
