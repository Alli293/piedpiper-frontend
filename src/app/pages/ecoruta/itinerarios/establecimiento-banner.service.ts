import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EstablecimientoBannerResponse } from './models/origen-banner.model';

@Injectable({ providedIn: 'root' })
export class EstablecimientoBannerService {
  static readonly URL = `${environment.apiBaseUrl}/establecimientos`;

  private readonly http = inject(HttpClient);

  obtenerBanner(empresaId: string): Observable<EstablecimientoBannerResponse> {
    return this.http.get<EstablecimientoBannerResponse>(
      `${EstablecimientoBannerService.URL}/${empresaId}/banner`
    );
  }
}
