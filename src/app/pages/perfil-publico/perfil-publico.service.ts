import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CertificacionPublica, InsigniaEmpresa } from './perfil-publico.models';

@Injectable({ providedIn: 'root' })
export class PerfilPublicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/perfil-publico`;

  listarCertificaciones(slug: string): Observable<CertificacionPublica[]> {
    return this.http.get<CertificacionPublica[]>(
      `${this.baseUrl}/${encodeURIComponent(slug)}/certificaciones`
    );
  }

  listarInsignias(slug: string): Observable<InsigniaEmpresa[]> {
    return this.http.get<InsigniaEmpresa[]>(
      `${this.baseUrl}/${encodeURIComponent(slug)}/insignias`
    );
  }

  descargarInsigniaJsonLd(urlVerificacionPublica: string): Observable<Blob> {
    return this.http.get(urlVerificacionPublica, { responseType: 'blob' });
  }

  descargarInsigniaJwt(urlVerificacionJwt: string): Observable<Blob> {
    return this.http.get(urlVerificacionJwt, { responseType: 'blob' });
  }
}
