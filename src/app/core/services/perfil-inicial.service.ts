import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PerfilInicial, PerfilInicialRequest } from '../models/perfil-inicial.model';

@Injectable({ providedIn: 'root' })
export class PerfilInicialService {
  static readonly URL = '/api/usuarios/me/perfil-inicial';

  private readonly http = inject(HttpClient);

  obtener(): Observable<PerfilInicial> {
    return this.http.get<PerfilInicial>(PerfilInicialService.URL);
  }

  completar(request: PerfilInicialRequest): Observable<PerfilInicial> {
    return this.http.put<PerfilInicial>(PerfilInicialService.URL, request);
  }
}
