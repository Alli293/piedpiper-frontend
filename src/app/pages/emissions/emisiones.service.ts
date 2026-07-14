import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EmisionResponse,
  RegistrarElectricidadRequest,
  RegistrarVueloRequest,
} from './models/emision.model';

@Injectable({ providedIn: 'root' })
export class EmisionesService {
  private readonly http = inject(HttpClient);

  registrarElectricidad(payload: RegistrarElectricidadRequest): Observable<EmisionResponse> {
    return this.http.post<EmisionResponse>('/api/emisiones/electricidad', payload);
  }

  registrarVuelo(payload: RegistrarVueloRequest): Observable<EmisionResponse> {
    return this.http.post<EmisionResponse>('/api/emisiones/vuelo', payload);
  }

  listarEmisiones(): Observable<EmisionResponse[]> {
    return this.http.get<EmisionResponse[]>('/api/emisiones');
  }

  obtenerEmision(id: string): Observable<EmisionResponse> {
    return this.http.get<EmisionResponse>(`/api/emisiones/${id}`);
  }

  actualizarVuelo(id: string, payload: RegistrarVueloRequest): Observable<EmisionResponse> {
    return this.http.put<EmisionResponse>(`/api/emisiones/vuelo/${id}`, payload);
  }

  eliminarEmision(id: string): Observable<void> {
    return this.http.delete<void>(`/api/emisiones/${id}`);
  }
}
