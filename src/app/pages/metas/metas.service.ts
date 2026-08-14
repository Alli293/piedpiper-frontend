import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearMetaRequest, MetaReduccion } from './metas.model';

@Injectable({ providedIn: 'root' })
export class MetasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/metas`;

  crearMeta(request: CrearMetaRequest): Observable<MetaReduccion> {
    return this.http.post<MetaReduccion>(this.baseUrl, request);
  }

  /** Lista las metas activas con el progreso calculado contra `periodo`/`anio` (mismo selector que el resumen de huella). */
  listarMetas(periodo?: string, anio?: number): Observable<MetaReduccion[]> {
    let params = new HttpParams();
    if (periodo) params = params.set('periodo', periodo);
    if (anio !== undefined) params = params.set('anio', anio);
    return this.http.get<MetaReduccion[]>(this.baseUrl, { params });
  }

  actualizarMeta(id: string, request: CrearMetaRequest): Observable<MetaReduccion> {
    return this.http.put<MetaReduccion>(`${this.baseUrl}/${id}`, request);
  }

  eliminarMeta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
