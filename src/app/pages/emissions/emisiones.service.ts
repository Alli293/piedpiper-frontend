import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoriaEmision,
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

const CATEGORIAS_RESUMEN: CategoriaEmision[] = ['ELECTRICIDAD', 'FLOTA', 'VUELO', 'ENVIO'];

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
    return this.listarEmisiones().pipe(
      map((emisiones) => {
        const emisionesPeriodo = emisiones.filter((emision) => enPeriodo(emision, anio, mes));
        const totalKg = emisionesPeriodo.reduce((total, emision) => total + emision.carbonKg, 0);
        const totalesPorCategoria = CATEGORIAS_RESUMEN.map((categoria) => {
          const categoriaTotalKg = emisionesPeriodo
            .filter((emision) => emision.categoria === categoria)
            .reduce((total, emision) => total + emision.carbonKg, 0);

          return {
            categoria,
            totalKg: categoriaTotalKg,
            porcentaje: totalKg === 0 ? 0 : Math.round((categoriaTotalKg / totalKg) * 1000) / 10,
          };
        });

        return {
          anio,
          mes: mes ?? null,
          totalKg,
          totalT: totalKg / 1000,
          categorias: totalesPorCategoria,
        };
      })
    );
  }
}

function enPeriodo(emision: EmisionResponse, anio: number, mes?: number): boolean {
  const fecha = parseFechaActividad(emision.fechaActividad);
  if (fecha.anio !== anio) return false;
  return mes === undefined || fecha.mes === mes;
}

function parseFechaActividad(fecha: string): { anio: number; mes: number } {
  const [anio, mes] = fecha.split('-').map(Number);
  return { anio, mes };
}
