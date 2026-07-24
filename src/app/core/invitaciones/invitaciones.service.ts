import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type EstadoInvitacion = 'ENVIADA' | 'ACEPTADA' | 'EXPIRADA' | 'REVOCADA';

export interface Invitacion {
  id: string;
  email: string;
  estado: EstadoInvitacion;
  fechaEmision: string;
  fechaExpiracion: string;
}

export interface InvitacionPublica {
  email: string;
  nombreEmpresa: string;
}

@Injectable({ providedIn: 'root' })
export class InvitacionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/empresas/invitaciones`;

  emitir(email: string): Observable<Invitacion> {
    return this.http.post<Invitacion>(this.baseUrl, { email });
  }

  listar(): Observable<Invitacion[]> {
    return this.http.get<Invitacion[]>(this.baseUrl);
  }

  revocar(id: string): Observable<Invitacion> {
    return this.http.post<Invitacion>(`${this.baseUrl}/${id}/revocar`, {});
  }

  resolver(token: string): Observable<InvitacionPublica> {
    return this.http.get<InvitacionPublica>(`${environment.apiBaseUrl}/auth/invitaciones/${token}`);
  }
}
