import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
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

  listar(filtros: FiltrosDirectorio): Observable<PaginaAuditores> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('tamanioPagina', TAMANIO_PAGINA_DIRECTORIO)
      .set('ordenamiento', filtros.ordenamiento);

    const termino = filtros.terminoBusqueda.trim();
    if (termino.length >= LONGITUD_MINIMA_BUSQUEDA && termino.length <= LONGITUD_MAXIMA_BUSQUEDA) {
      params = params.set('terminoBusqueda', termino);
    }

    return this.http.get<PaginaAuditores>(this.baseUrl, { params });
  }
}
