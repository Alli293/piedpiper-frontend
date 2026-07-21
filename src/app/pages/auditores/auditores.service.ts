import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogoItem,
  FiltrosDirectorio,
  LONGITUD_MAXIMA_BUSQUEDA,
  LONGITUD_MINIMA_BUSQUEDA,
  PaginaAuditores,
  TAMANIO_PAGINA_DIRECTORIO,
} from './auditor.model';

@Injectable({ providedIn: 'root' })
export class AuditoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditores`;
  private readonly catalogosUrl = `${environment.apiBaseUrl}/catalogos`;

  listar(filtros: FiltrosDirectorio): Observable<PaginaAuditores> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('tamanioPagina', TAMANIO_PAGINA_DIRECTORIO)
      .set('ordenamiento', filtros.ordenamiento)
      .set('soloDisponibles', filtros.soloDisponibles);

    const termino = filtros.terminoBusqueda;
    if (termino.length >= LONGITUD_MINIMA_BUSQUEDA && termino.length <= LONGITUD_MAXIMA_BUSQUEDA) {
      params = params.set('terminoBusqueda', termino);
    }
    for (const especialidad of filtros.especialidades) {
      params = params.append('especialidades', especialidad);
    }
    if (filtros.zonaGeografica) {
      params = params.set('zonaGeografica', filtros.zonaGeografica);
    }
    if (filtros.calificacionMinima !== null) {
      params = params.set('calificacionMinima', filtros.calificacionMinima);
    }

    return this.http.get<PaginaAuditores>(this.baseUrl, { params });
  }

  obtenerEspecialidades(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.catalogosUrl}/especialidades`);
  }

  obtenerZonas(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(`${this.catalogosUrl}/zonas`);
  }
}
