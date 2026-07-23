import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ComparacionEmisionesResponse } from '../emissions/models/emision.model';
import { PeriodoDashboard, ResumenHuellaDashboardResponse } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardBaseUrl = `${environment.apiBaseUrl}/dashboard`;
  private readonly emisionesBaseUrl = `${environment.apiBaseUrl}/emisiones`;

  obtenerResumenHuella(
    periodo: PeriodoDashboard,
    anio?: number
  ): Observable<ResumenHuellaDashboardResponse> {
    let params = new HttpParams().set('periodo', periodo);
    if (anio !== undefined) {
      params = params.set('anio', anio);
    }
    return this.http.get<ResumenHuellaDashboardResponse>(`${this.dashboardBaseUrl}/huella`, {
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
