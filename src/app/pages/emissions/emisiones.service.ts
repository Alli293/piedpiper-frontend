import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoriaFiltroEmision,
  ComparacionEmisionesResponse,
  EmisionEnvioResponse,
  EmisionFlotaResponse,
  EmisionResponse,
  RegistrarElectricidadRequest,
  RegistrarEnvioRequest,
  RegistrarFlotaRequest,
  RegistrarVueloRequest,
  ResumenEmisionesResponse,
  TipoVehiculoOption,
} from './models/emision.model';

export interface EmisionesFiltros {
  readonly categoria?: CategoriaFiltroEmision;
  readonly anio?: number | null;
  readonly mes?: number | null;
}

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

  listarEmisiones(filtros: EmisionesFiltros = {}): Observable<EmisionResponse[]> {
    let params = new HttpParams();
    if (filtros.categoria && filtros.categoria !== 'TODAS') {
      params = params.set('categoria', filtros.categoria);
    }
    if (filtros.anio) {
      params = params.set('anio', filtros.anio);
    }
    if (filtros.mes) {
      params = params.set('mes', filtros.mes);
    }

    return this.http.get<EmisionResponse[]>(this.baseUrl, { params });
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

  obtenerComparacion(anio: number): Observable<ComparacionEmisionesResponse> {
    const params = new HttpParams().set('anio', anio);
    return this.http.get<ComparacionEmisionesResponse>(`${this.baseUrl}/comparacion`, { params });
  }

  obtenerResumen(anio: number, mes?: number): Observable<ResumenEmisionesResponse> {
    let params = new HttpParams().set('anio', anio);
    if (mes !== undefined) {
      params = params.set('mes', mes);
    }
    return this.http.get<ResumenEmisionesResponse>(`${this.baseUrl}/resumen`, { params });
  }
}
