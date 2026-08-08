import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnlacePerfilDTO } from './models/enlace-perfil.model';
import {
  BusquedaPerfilPublicoDTO,
  CertificacionPublica,
  EvolucionHuellaPublica,
  EvolucionHuellaDTO,
  InsigniaEmpresa,
  PageResponse,
  PerfilPublicoDTO,
  RangoPeriodoHuella,
} from './perfil-publico.models';

@Injectable({ providedIn: 'root' })
export class PerfilPublicoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/perfil-publico`;

  obtenerPerfil(slug: string): Observable<PerfilPublicoDTO> {
    if (!slug || !slug.trim()) {
      return throwError(() => new Error('El slug no puede estar vacío.'));
    }
    return this.http.get<PerfilPublicoDTO>(`${this.baseUrl}/${slug}`);
  }

  listarCertificaciones(slug: string): Observable<CertificacionPublica[]> {
    return this.http.get<CertificacionPublica[]>(
      `${this.baseUrl}/${encodeURIComponent(slug)}/certificaciones`
    );
  }

  buscarEmpresas(
    nombre: string,
    page = 0,
    size = 10
  ): Observable<PageResponse<BusquedaPerfilPublicoDTO>> {
    const params = new HttpParams()
      .set('nombre', nombre)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<BusquedaPerfilPublicoDTO>>(`${this.baseUrl}/buscar`, {
      params,
    });
  }

  listarInsignias(slug: string): Observable<InsigniaEmpresa[]> {
    return this.http.get<InsigniaEmpresa[]>(
      `${this.baseUrl}/${encodeURIComponent(slug)}/insignias`
    );
  }

  obtenerEvolucionHuella(
    slug: string,
    rango: RangoPeriodoHuella = 'ultimos_3_anios'
  ): Observable<EvolucionHuellaDTO> {
    const params = new HttpParams().set('rango', rango);
    return this.http.get<EvolucionHuellaDTO>(`${this.baseUrl}/${encodeURIComponent(slug)}/huella`, {
      params,
    });
  }

  descargarInsigniaJsonLd(urlVerificacionPublica: string): Observable<Blob> {
    return this.http.get(urlVerificacionPublica, { responseType: 'blob' });
  }

  descargarInsigniaJwt(urlVerificacionJwt: string): Observable<Blob> {
    return this.http.get(urlVerificacionJwt, { responseType: 'blob' });
  }

  obtenerEnlaceComparticion(slug: string): Observable<EnlacePerfilDTO> {
    return this.http.get<EnlacePerfilDTO>(`${this.baseUrl}/${encodeURIComponent(slug)}/compartir`);
  }

  obtenerEvolucionHuellaPublica(slug: string): Observable<EvolucionHuellaPublica> {
    return this.http.get<EvolucionHuellaPublica>(
      `${this.baseUrl}/${encodeURIComponent(slug)}/evolucion-huella`
    );
  }
}
