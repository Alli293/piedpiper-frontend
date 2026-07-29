import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CertificacionPublica, PerfilPublicoDTO } from './perfil-publico.models';

@Injectable({ providedIn: 'root' })
export class PerfilPublicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/perfil-publico`;

  obtenerPerfil(slug: string): Observable<PerfilPublicoDTO> {
    if (!slug || !slug.trim()) {
      return throwError(() => new Error('El slug no puede estar vacío.'));
    }
    return this.http.get<PerfilPublicoDTO>(`${this.baseUrl}/${slug}`);
  }

  listarCertificaciones(slug: string): Observable<CertificacionPublica[]> {
    return this.http.get<CertificacionPublica[]>(
      `${this.baseUrl}/${encodeURIComponent(slug)}/certificaciones`
    );
  }
}
