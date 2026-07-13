import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmisionResponse, RegistrarElectricidadRequest } from './models/emision.model';

@Injectable({ providedIn: 'root' })
export class EmisionesService {
  private readonly http = inject(HttpClient);

  registrarElectricidad(payload: RegistrarElectricidadRequest): Observable<EmisionResponse> {
    return this.http.post<EmisionResponse>('/api/emisiones/electricidad', payload);
  }
}
