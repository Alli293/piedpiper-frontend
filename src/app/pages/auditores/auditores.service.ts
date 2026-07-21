import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FiltrosDirectorio, PaginaAuditores } from './auditor.model';

const TAMANIO_PAGINA = 12;

@Injectable({ providedIn: 'root' })
export class AuditoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditores`;

  listar(filtros: FiltrosDirectorio): Observable<PaginaAuditores> {
    let params = new HttpParams()
      .set('pagina', filtros.pagina)
      .set('tamanioPagina', TAMANIO_PAGINA)
      .set('ordenamiento', filtros.ordenamiento);

    if (filtros.terminoBusqueda.length >= 2) {
      params = params.set('terminoBusqueda', filtros.terminoBusqueda);
    }

    return this.http.get<PaginaAuditores>(this.baseUrl, { params });
  }
}
