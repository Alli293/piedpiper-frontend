import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ComparacionEmisionesResponse } from '../emissions/models/emision.model';
import {
  CalendarioVencimientosResponse,
  PeriodoDashboard,
  ResumenCertificacionesDashboardResponse,
  ResumenHuellaDashboardResponse,
} from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardBaseUrl = `${environment.apiBaseUrl}/dashboard`;
  private readonly emisionesBaseUrl = `${environment.apiBaseUrl}/emisiones`;

  obtenerResumenHuella(
    periodo: PeriodoDashboard,
    anio: number
  ): Observable<ResumenHuellaDashboardResponse> {
    const params = new HttpParams().set('periodo', periodo).set('anio', anio);
    return this.http.get<ResumenHuellaDashboardResponse>(`${this.dashboardBaseUrl}/huella`, {
      params,
    });
  }

  /** Conteos del bloque "Estado de certificaciones" (PP-74). */
  obtenerResumenCertificaciones(): Observable<ResumenCertificacionesDashboardResponse> {
    return this.http.get<ResumenCertificacionesDashboardResponse>(
      `${this.dashboardBaseUrl}/certificaciones`
    );
  }

  /** Calendario de vencimientos (PP-77). `mes` en formato 'YYYY-MM'. */
  obtenerCalendarioVencimientos(mes: string): Observable<CalendarioVencimientosResponse> {
    const params = new HttpParams().set('mes', mes);
    return this.http.get<CalendarioVencimientosResponse>(`${this.dashboardBaseUrl}/calendario`, {
      params,
    });
  }

  obtenerComparacion(anio: number): Observable<ComparacionEmisionesResponse> {
    const params = new HttpParams().set('anio', anio);
    return this.http.get<ComparacionEmisionesResponse>(`${this.emisionesBaseUrl}/comparacion`, {
      params,
    });
  }

  exportarReportePdf(anio: number, mes?: number): Observable<Blob> {
    let params = new HttpParams().set('anio', anio);
    if (mes !== undefined) {
      params = params.set('mes', mes);
    }
    return this.http.get(`${this.emisionesBaseUrl}/reporte/pdf`, { params, responseType: 'blob' });
  }
}
