import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PerfilPublicoAuditorResponse } from '../models/perfil-publico-auditor.model';

@Injectable({ providedIn: 'root' })
export class PerfilPublicoAuditorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditores`;

  obtenerPerfilPublico(auditorId: string): Observable<PerfilPublicoAuditorResponse> {
    return this.http.get<PerfilPublicoAuditorResponse>(`${this.baseUrl}/${auditorId}`);
  }
}
