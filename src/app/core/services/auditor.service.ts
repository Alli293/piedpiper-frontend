import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService as CoreAuthService } from '../auth/auth.service';

export interface ConfiguracionInicialResponse {
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AuditorService {
  private http = inject(HttpClient);
  private coreAuth = inject(CoreAuthService);
  private baseUrl = environment.apiUrl + '/auditor';

  enviarConfiguracionInicial(formData: FormData): Observable<ConfiguracionInicialResponse> {
    const token = this.coreAuth.token();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post<ConfiguracionInicialResponse>(
      `${this.baseUrl}/configuracion-inicial`,
      formData,
      { headers }
    );
  }
}
