import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Certificacion, CertificacionResumen } from '../models/certificacion.model';

@Injectable({ providedIn: 'root' })
export class CertificacionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/certificaciones`;

  listar(): Observable<CertificacionResumen[]> {
    return this.http.get<CertificacionResumen[]>(this.baseUrl);
  }

  obtener(id: string): Observable<Certificacion> {
    return this.http.get<Certificacion>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  descargarJsonLd(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${encodeURIComponent(id)}/jsonld`, {
      responseType: 'blob',
    });
  }
}
