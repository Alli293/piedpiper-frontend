import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConfiguracionInicialEmpresaRequest,
  ConfiguracionInicialEmpresaResponse,
  InsigniaEmpresa,
} from './empresa.models';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/empresas`;

  completarConfiguracionEmpresa(
    datos: ConfiguracionInicialEmpresaRequest
  ): Observable<ConfiguracionInicialEmpresaResponse> {
    return this.http.post<ConfiguracionInicialEmpresaResponse>(
      `${this.baseUrl}/configuracion-inicial`,
      datos
    );
  }

  listarInsignias(): Observable<InsigniaEmpresa[]> {
    return this.http.get<InsigniaEmpresa[]>(`${this.baseUrl}/insignias`);
  }

  descargarInsigniaJsonLd(idInsigniaEmpresa: string): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/insignias/${idInsigniaEmpresa}/jsonld`, {
      responseType: 'blob',
    });
  }

  descargarInsigniaJwt(urlVerificacionJwt: string): Observable<Blob> {
    return this.http.get(urlVerificacionJwt, { responseType: 'blob' });
  }
}
