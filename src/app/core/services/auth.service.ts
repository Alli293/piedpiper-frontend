import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  RegistroAuditorResponse,
  VerificacionEmailResponse,
} from '../models/registro-auditor.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/auth';

  registrarAuditor(formData: FormData): Observable<RegistroAuditorResponse> {
    return this.http.post<RegistroAuditorResponse>(
      `${this.baseUrl}/registro-auditor`,
      formData
    );
  }

  verificarEmail(token: string): Observable<VerificacionEmailResponse> {
    return this.http.get<VerificacionEmailResponse>(
      `${this.baseUrl}/verificar-email`,
      { params: { token } }
    );
  }

  reenviarVerificacion(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/reenviar-verificacion`, {
      email,
    });
  }
}
