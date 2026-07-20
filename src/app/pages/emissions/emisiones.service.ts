import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ComparacionEmisionesResponse,
  EmisionEnvioResponse,
  EmisionFlotaResponse,
  EmisionResponse,
  RegistrarElectricidadRequest,
  RegistrarEnvioRequest,
  RegistrarFlotaRequest,
  RegistrarVueloRequest,
  TipoVehiculoOption,
} from './models/emision.model';

@Injectable({ providedIn: 'root' })
export class EmisionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/emisiones`;

  registrarElectricidad(payload: RegistrarElectricidadRequest): Observable<EmisionResponse> {
    return this.http.post<EmisionResponse>(`${this.baseUrl}/electricidad`, payload);
  }

  registrarEnvio(payload: RegistrarEnvioRequest): Observable<EmisionEnvioResponse> {
    return this.http.post<EmisionEnvioResponse>(`${this.baseUrl}/envio`, payload);
  }

  registrarVuelo(payload: RegistrarVueloRequest): Observable<EmisionResponse> {
    return this.http.post<EmisionResponse>(`${this.baseUrl}/vuelo`, payload);
  }

  listarEmisiones(): Observable<EmisionResponse[]> {
    return this.http.get<EmisionResponse[]>(this.baseUrl);
  }

  obtenerComparacion(anio: number): Observable<ComparacionEmisionesResponse> {
    const params = new HttpParams().set('anio', anio);
    return this.http.get<ComparacionEmisionesResponse>(`${this.baseUrl}/comparacion`, { params });
  }

  actualizarVuelo(id: string, payload: RegistrarVueloRequest): Observable<EmisionResponse> {
    return this.http.put<EmisionResponse>(`${this.baseUrl}/vuelo/${id}`, payload);
  }

  eliminarEmision(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  obtenerTiposVehiculo(): Observable<TipoVehiculoOption[]> {
    return this.http.get<TipoVehiculoOption[]>(`${this.baseUrl}/flota/tipos-vehiculo`);
  }

  registrarFlota(payload: RegistrarFlotaRequest): Observable<EmisionFlotaResponse> {
    return this.http.post<EmisionFlotaResponse>(`${this.baseUrl}/flota`, payload);
  }
}
