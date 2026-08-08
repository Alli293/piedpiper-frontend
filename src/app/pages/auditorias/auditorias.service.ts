import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AsignarAuditorRequest,
  DetalleSolicitudAuditoria,
  EmitirResultadoAuditoriaRequest,
  ResponderDecisionRequest,
  ResumenSolicitudAuditoria,
  NuevaSolicitudAuditoriaRequest,
  SolicitudAuditoria,
  SolicitudAuditoriaAsignada,
} from './auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditorias`;

  /** Solicitudes de la empresa autenticada. El backend resuelve cuál es a partir del usuario. */
  listarDeMiEmpresa(): Observable<ResumenSolicitudAuditoria[]> {
    return this.http.get<ResumenSolicitudAuditoria[]>(this.baseUrl);
  }

  /** Solicitudes asignadas al auditor autenticado. */
  listarAsignadas(): Observable<ResumenSolicitudAuditoria[]> {
    return this.http.get<ResumenSolicitudAuditoria[]>(`${this.baseUrl}/asignadas`);
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
