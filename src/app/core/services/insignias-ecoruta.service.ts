import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InsigniaEcoRuta } from '../models/insignia-ecoruta.model';

@Injectable({ providedIn: 'root' })
export class InsigniasEcoRutaService {
  static readonly URL = '/api/ecoruta/insignias/me';

  private readonly http = inject(HttpClient);

  listarObtenidas(): Observable<InsigniaEcoRuta[]> {
    return this.http.get<InsigniaEcoRuta[]>(InsigniasEcoRutaService.URL);
  }
}
