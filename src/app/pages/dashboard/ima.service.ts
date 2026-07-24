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
  interpretacionIa: string | null;
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
  | BenchmarkDisponibleResponse
  | BenchmarkNoDisponibleResponse;

@Injectable({ providedIn: 'root' })
export class ImaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ima`;

  obtenerIma(anio: number, mes: number): Observable<ImaResponse> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<ImaResponse>(this.baseUrl, { params });
  }

  obtenerBenchmark(anio: number, mes: number): Observable<BenchmarkSectorialResponse> {
    const params = new HttpParams().set('anio', anio).set('mes', mes);
    return this.http.get<BenchmarkSectorialResponse>(`${this.baseUrl}/benchmark`, { params });
  }
}
