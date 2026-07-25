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
/** Punto de la serie histórica del IMA. Los valores en null no se grafican. */
export interface ImaTendenciaPunto {
  mes: string;
  imaEmpresa: number | null;
  imaPromedioSector: number | null;
}

export type TipoEventoIma = 'CRUCE_SECTOR' | 'MAYOR_VARIACION' | 'HUECO_DATOS' | 'NUEVA_CATEGORIA';

/** Evento anotado sobre la serie, calculado por el backend. */
export interface ImaEvento {
  mes: string;
  tipo: TipoEventoIma;
  texto: string;
}

export interface ImaTendenciaResponse {
  mesesAtras: number;
  serie: ImaTendenciaPunto[];
  sinDatosSectoriales: boolean;
  eventos: ImaEvento[];
}

export type PosicionBenchmark = 'POR_ENCIMA' | 'EN_LINEA' | 'POR_DEBAJO';

export interface BenchmarkDimension {
  valorEmpresa: number | null;
  promedioSector: number | null;
  posicion: PosicionBenchmark | null;
}

interface BenchmarkBase {
  cantidadEmpresas: number;
  imaParcial: boolean;
}

export interface BenchmarkDisponibleResponse extends BenchmarkBase {
  benchmarkDisponible: true;
  ima: BenchmarkDimension;
  cobertura: BenchmarkDimension;
  puntajeIntensidadSectorial: BenchmarkDimension;
  consistencia: BenchmarkDimension;
}

export interface BenchmarkNoDisponibleResponse extends BenchmarkBase {
  benchmarkDisponible: false;
  ima: null;
  cobertura: null;
  puntajeIntensidadSectorial: null;
  consistencia: null;
}

export type BenchmarkSectorialResponse =
  BenchmarkDisponibleResponse | BenchmarkNoDisponibleResponse;

@Injectable({ providedIn: 'root' })
export class ImaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ima`;

  obtenerIma(anio: number, mes: number): Observable<ImaResponse> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<ImaResponse>(this.baseUrl, { params });
  }

  obtenerTendencia(mesesAtras: number): Observable<ImaTendenciaResponse> {
    const params = new HttpParams().set('mesesAtras', mesesAtras);
    return this.http.get<ImaTendenciaResponse>(`${this.baseUrl}/tendencia`, { params });
  }

  obtenerBenchmark(anio: number, mes: number): Observable<BenchmarkSectorialResponse> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<BenchmarkSectorialResponse>(`${this.baseUrl}/benchmark`, { params });
  }
}
