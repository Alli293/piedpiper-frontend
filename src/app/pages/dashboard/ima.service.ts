import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
export interface ImaResponse {
  cobertura: number;
  puntajeIntensidadSectorial: number | null;
  consistencia: number;
  ima: number;
  parcial: boolean;
  motivoParcial: string | null;
  intensidad: number | null;
  calculatedAt: string;
  interpretacion: string | null;
  siguientePaso: string | null;
}
@Injectable({ providedIn: 'root' })
export class ImaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ima`;
  obtenerIma(anio: number, mes: number): Observable<ImaResponse> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<ImaResponse>(this.baseUrl, { params });
  }
}
