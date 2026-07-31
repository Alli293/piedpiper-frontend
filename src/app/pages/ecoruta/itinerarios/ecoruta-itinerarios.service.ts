import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Itinerario } from './models/itinerario.model';

@Injectable({ providedIn: 'root' })
export class EcoRutaItinerariosService {
  static readonly URL = `${environment.apiBaseUrl}/ecoruta/itinerarios`;

  private readonly http = inject(HttpClient);

  generar(): Observable<Itinerario> {
    return this.http.post<Itinerario>(`${EcoRutaItinerariosService.URL}/generar`, {});
  }

  obtener(id: string): Observable<Itinerario> {
    return this.http.get<Itinerario>(`${EcoRutaItinerariosService.URL}/${id}`);
  }
}
