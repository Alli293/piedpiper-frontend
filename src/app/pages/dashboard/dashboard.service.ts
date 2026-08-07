import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ComparacionEmisionesResponse } from '../emissions/models/emision.model';
import {
  AlertaVencimiento,
  CalendarioVencimientosResponse,
  InsigniaEmpresa,
  PeriodoDashboard,
  RecomendacionRenovacion,
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

  /** Alertas activas del panel del dashboard (PP-76), ordenadas de más a menos urgente. */
  obtenerAlertas(): Observable<AlertaVencimiento[]> {
    return this.http.get<AlertaVencimiento[]>(`${this.dashboardBaseUrl}/alertas`);
  }

  /**
   * Recomendación de renovación generada por IA (PP-72). `null` cuando no hay
   * certificaciones con alerta activa (el backend responde 200 sin cuerpo en
   * ese caso; Angular lo traduce a `null`).
   */
  obtenerRecomendacion(): Observable<RecomendacionRenovacion | null> {
    return this.http.get<RecomendacionRenovacion | null>(`${this.dashboardBaseUrl}/recomendacion`);
  }

  obtenerComparacion(anio: number): Observable<ComparacionEmisionesResponse> {
    const params = new HttpParams().set('anio', anio);
    return this.http.get<ComparacionEmisionesResponse>(`${this.emisionesBaseUrl}/comparacion`, {
      params,
    });
  }

  listarInsignias(): Observable<InsigniaEmpresa[]> {
    return this.http.get<InsigniaEmpresa[]>(`${this.dashboardBaseUrl}/insignias`);
  }

  exportarReportePdf(anio: number, mes?: number): Observable<Blob> {
    let params = new HttpParams().set('anio', anio);
    if (mes !== undefined) {
      params = params.set('mes', mes);
    }
    return this.http.get(`${this.emisionesBaseUrl}/reporte/pdf`, { params, responseType: 'blob' });
  }
}
