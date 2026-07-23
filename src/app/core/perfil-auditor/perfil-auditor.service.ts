import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarPerfilRequest,
  PerfilAuditorResponse,
} from '../models/perfil-auditor.model';
import { CatalogoItem } from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class PerfilAuditorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditores`;

  actualizarPerfil(
    auditorId: string,
    dto: ActualizarPerfilRequest
  ): Observable<PerfilAuditorResponse> {
    return this.http.put<PerfilAuditorResponse>(
      `${this.baseUrl}/${auditorId}/perfil`,
      dto
    );
  }

  obtenerEspecialidades(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(
      `${environment.apiBaseUrl}/catalogos/especialidades`
    );
  }

  obtenerZonasCobertura(): Observable<CatalogoItem[]> {
    return this.http.get<CatalogoItem[]>(
      `${environment.apiBaseUrl}/catalogos/zonas`
    );
  }
}
