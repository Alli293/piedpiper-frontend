import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';

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
  mensaje: string;
  actualizadoEn: string | null;
}

@Injectable({ providedIn: 'root' })
export class LimitesService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly apiUrl = '/api/limites';

  obtenerLimite(anio: number): Observable<LimiteEmisionesResponse> {
    return this.http.get<LimiteEmisionesResponse>(`${this.apiUrl}/${anio}`, {
      headers: this.headers(),
    });
  }

  listarLimites(): Observable<LimiteEmisionesResponse[]> {
    return this.http.get<LimiteEmisionesResponse[]>(this.apiUrl, {
      headers: this.headers(),
    });
  }

  guardarLimite(request: LimiteEmisionesRequest): Observable<LimiteEmisionesResponse> {
    return this.http.post<LimiteEmisionesResponse>(this.apiUrl, request, {
      headers: this.headers(),
    });
  }

  actualizarLimite(request: LimiteEmisionesRequest): Observable<LimiteEmisionesResponse> {
    return this.http.post<LimiteEmisionesResponse>(this.apiUrl, request, {
      headers: this.headers(),
    });
  }

  eliminarLimite(anio: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${anio}`, {
      headers: this.headers(),
    });
  }

  private headers(): HttpHeaders {
    const token = this.authSession.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
