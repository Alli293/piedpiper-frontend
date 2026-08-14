export interface ActualizarPerfilRequest {
  especialidades: string[];
  zonasCobertura: string[];
  disponible: boolean;
  descripcionProfesional: string | null;
}

export interface PerfilAuditorResponse {
  auditorId: string;
  especialidades: string[];
  zonasCobertura: string[];
  disponible: boolean;
  descripcionProfesional: string | null;
  actualizadoEn: string;
}
