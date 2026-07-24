import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PreferenciasViajeRequest,
  PreferenciasViajeResponse,
} from './models/preferencias-viaje.model';

@Injectable({ providedIn: 'root' })
export class EcoRutaPreferenciasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/ecoruta/preferencias`;

  obtener(): Observable<PreferenciasViajeResponse> {
    return this.http.get<PreferenciasViajeResponse>(this.apiUrl);
  }

  guardar(request: PreferenciasViajeRequest): Observable<PreferenciasViajeResponse> {
    return this.http.post<PreferenciasViajeResponse>(this.apiUrl, request);
  }
}
