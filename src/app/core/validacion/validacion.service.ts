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

@Injectable({ providedIn: 'root' })
export class ValidacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/solicitudes-auditor`;

  listarPendientes(pagina: number): Observable<PaginaSolicitudes> {
    return this.http.get<PaginaSolicitudes>(this.baseUrl, { params: { pagina } });
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
