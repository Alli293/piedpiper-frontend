import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MiSolicitudAuditor {
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  fechaSolicitud: string;
  fechaResolucion: string | null;
  motivoRechazo: string | null;
}

@Injectable({ providedIn: 'root' })
export class MiSolicitudAuditorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditor/mi-solicitud`;

  obtener(): Observable<MiSolicitudAuditor> {
    return this.http.get<MiSolicitudAuditor>(this.baseUrl);
  }
}
