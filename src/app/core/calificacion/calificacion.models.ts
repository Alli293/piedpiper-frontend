export interface CrearCalificacionRequest {
  auditoriaId: string;
  calificacion: number;
  comentario?: string;
}

export interface EditarCalificacionRequest {
  calificacion: number;
  comentario?: string;
}

export interface CalificacionResponse {
  id: string;
  auditoriaId: string;
  auditorId: string;
  empresaId: string;
  calificacion: number;
  comentario: string | null;
  creadoEn: string;
  actualizadoEn: string;
}
