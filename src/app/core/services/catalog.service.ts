import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EntidadCertificadora } from '../models/entidad-certificadora.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/catalogs';

  getEntidadesCertificadoras(): Observable<EntidadCertificadora[]> {
    return this.http.get<EntidadCertificadora[]>(
      `${this.baseUrl}/entidades-certificadoras`
    );
  }
}
