import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MensajeResponse } from '../auth/auth.models';
import { CompletarConfiguracionAuditorRequest } from './configuracion-inicial-auditor.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracionInicialAuditorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/auditor/configuracion-inicial`;

  completar(
    datos: CompletarConfiguracionAuditorRequest,
    documentos: File[]
  ): Observable<MensajeResponse> {
    const formData = new FormData();
    formData.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    for (const documento of documentos) {
      formData.append('documentos', documento, documento.name);
    }

    return this.http.post<MensajeResponse>(this.baseUrl, formData);
  }
}
