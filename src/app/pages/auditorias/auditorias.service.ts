import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AsignarAuditorRequest,
  FiltroListadoAuditorias,
  PaginaSolicitudesAuditoria,
  DetalleSolicitudAuditoria,
  EmitirResultadoAuditoriaRequest,
  ResponderDecisionRequest,
  NuevaSolicitudAuditoriaRequest,
  SolicitudAuditoria,
  SolicitudAuditoriaAsignada,
} from './auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditorias`;

  /**
   * Listado paginado del usuario autenticado. No recibe de quién: el backend lo resuelve por el
   * rol del token, así que la misma llamada sirve para la empresa y para el auditor.
   *
   * <p>Los estados viajan como parámetros repetidos (`filtroEstado=A&filtroEstado=B`), que es la
   * forma que `@ModelAttribute` deserializa a una lista en el servidor.</p>
   */
  listar(filtros: FiltroListadoAuditorias = {}): Observable<PaginaSolicitudesAuditoria> {
    let params = new HttpParams().set('pagina', filtros.pagina ?? 1);
    for (const estado of filtros.filtroEstado ?? []) {
      params = params.append('filtroEstado', estado);
    }

    return this.http.get<PaginaSolicitudesAuditoria>(this.baseUrl, { params });
  }

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

  obtenerSolicitud(idSolicitud: string): Observable<SolicitudAuditoriaAsignada> {
    return this.http.get<SolicitudAuditoriaAsignada>(`${this.baseUrl}/${idSolicitud}`);
  }

  /**
   * Misma ruta que {@link obtenerSolicitud}: el backend devuelve el historial dentro de la
   * respuesta, así que son dos vistas del mismo recurso y no dos endpoints.
   */
  obtenerDetalle(idSolicitud: string): Observable<DetalleSolicitudAuditoria> {
    return this.http.get<DetalleSolicitudAuditoria>(`${this.baseUrl}/${idSolicitud}`);
  }

  responderDecision(idSolicitud: string, request: ResponderDecisionRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${idSolicitud}/decision`, request);
  }

  emitirResultado(
    idSolicitud: string,
    request: EmitirResultadoAuditoriaRequest
  ): Observable<DetalleSolicitudAuditoria> {
    return this.http.post<DetalleSolicitudAuditoria>(
      `${this.baseUrl}/${idSolicitud}/resultado`,
      request
    );
  }

  cargarReporte(
    idSolicitud: string,
    reporteAuditoria: File,
    fechaAuditoriaRealizada: string
  ): Observable<DetalleSolicitudAuditoria> {
    const formData = new FormData();
    formData.append('reporteAuditoria', reporteAuditoria, reporteAuditoria.name);
    formData.append('fechaAuditoriaRealizada', fechaAuditoriaRealizada);

    return this.http.post<DetalleSolicitudAuditoria>(
      `${this.baseUrl}/${idSolicitud}/reporte`,
      formData
    );
  }

  /**
   * Trae el contenido del documento por el cliente HTTP y no por la URL directa: el endpoint exige
   * la cabecera de autenticación, que solo agrega el interceptor. Un enlace apuntando a la URL
   * devolvería 401.
   */
  descargarDocumento(idSolicitud: string, idDocumento: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${idSolicitud}/documentos/${idDocumento}`, {
      responseType: 'blob',
    });
  }

  asignarAuditor(
    idSolicitud: string,
    request: AsignarAuditorRequest
  ): Observable<SolicitudAuditoriaAsignada> {
    return this.http.post<SolicitudAuditoriaAsignada>(
      `${this.baseUrl}/${idSolicitud}/auditor`,
      request
    );
  }
}
