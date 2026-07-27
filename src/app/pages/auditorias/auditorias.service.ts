import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NuevaSolicitudAuditoriaRequest, SolicitudAuditoria } from './auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditorias`;

  crearSolicitud(
    datos: NuevaSolicitudAuditoriaRequest,
    documentos: File[]
  ): Observable<SolicitudAuditoria> {
    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    for (const documento of documentos) {
      formData.append('documentos', documento, documento.name);
    }

    return this.http.post<SolicitudAuditoria>(this.baseUrl, formData);
  }
}
