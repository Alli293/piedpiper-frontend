import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VerificacionCredencial } from './verificacion-publica.models';

@Injectable({ providedIn: 'root' })
export class VerificacionPublicaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/verificar`;

  verificar(codigo: string): Observable<VerificacionCredencial> {
    return this.http.get<VerificacionCredencial>(`${this.baseUrl}/${encodeURIComponent(codigo)}`);
  }
}
