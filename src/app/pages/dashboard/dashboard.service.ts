import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/emisiones`;

  exportarReportePdf(anio: number, mes?: number): Observable<Blob> {
    let params = new HttpParams().set('anio', anio);
    if (mes !== undefined) {
      params = params.set('mes', mes);
    }
    return this.http.get(`${this.baseUrl}/reporte/pdf`, { params, responseType: 'blob' });
  }
}
