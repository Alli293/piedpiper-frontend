import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SolicitudPendiente {
  id: string;
  nombreAuditor: string;
  email: string;
  fechaSolicitud: string;
}

export interface PaginaSolicitudes {
  contenido: SolicitudPendiente[];
  pagina: number;
  totalPaginas: number;
  totalElementos: number;
}

export interface SolicitudResuelta {
  id: string;
  estado: string;
  estadoAuditor: string;
  fechaResolucion: string;
  motivoRechazo: string | null;
}

export interface DocumentoCredencialResumen {
  id: string;
  nombreArchivo: string;
  tamanioBytes: number;
}

export interface SolicitudDetalle {
  id: string;
  nombreAuditor: string;
  email: string;
  estado: string;
  fechaSolicitud: string;
  aniosExperiencia: number | null;
  especialidades: string[];
  descripcionProfesional: string | null;
  sitioWeb: string | null;
  documentos: DocumentoCredencialResumen[];
}

@Injectable({ providedIn: 'root' })
export class ValidacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/solicitudes-auditor`;

  listarPendientes(pagina: number): Observable<PaginaSolicitudes> {
    return this.http.get<PaginaSolicitudes>(this.baseUrl, { params: { pagina } });
  }

  obtenerDetalle(solicitudId: string): Observable<SolicitudDetalle> {
    return this.http.get<SolicitudDetalle>(`${this.baseUrl}/${solicitudId}`);
  }

  descargarDocumento(solicitudId: string, documentoId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${solicitudId}/documentos/${documentoId}`, {
      responseType: 'blob',
    });
  }

  resolver(
    solicitudId: string,
    decision: 'aprobado' | 'rechazado',
    motivoRechazo?: string
  ): Observable<SolicitudResuelta> {
    return this.http.post<SolicitudResuelta>(`${this.baseUrl}/${solicitudId}/decision`, {
      decision,
      motivoRechazo: motivoRechazo ?? null,
    });
  }
}
