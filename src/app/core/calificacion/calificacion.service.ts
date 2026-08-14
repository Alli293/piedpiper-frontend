import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CalificacionResponse,
  CrearCalificacionRequest,
  EditarCalificacionRequest,
} from './calificacion.models';

@Injectable({ providedIn: 'root' })
export class CalificacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/calificaciones`;

  crearCalificacion(payload: CrearCalificacionRequest): Observable<CalificacionResponse> {
    return this.http.post<CalificacionResponse>(this.baseUrl, payload);
  }

  editarCalificacion(
    calificacionId: string,
    payload: EditarCalificacionRequest
  ): Observable<CalificacionResponse> {
    return this.http.put<CalificacionResponse>(`${this.baseUrl}/${calificacionId}`, payload);
  }

  obtenerPorAuditoria(auditoriaId: string): Observable<CalificacionResponse | null> {
    return this.http
      .get<CalificacionResponse>(`${this.baseUrl}/auditoria/${auditoriaId}`)
      .pipe(
        catchError((err: HttpErrorResponse) =>
          err.status === 404 ? of(null) : throwError(() => err)
        )
      );
  }
}
