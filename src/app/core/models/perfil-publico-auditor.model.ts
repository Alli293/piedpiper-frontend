export interface CertificacionPublica {
  nombre: string;
  entidadCertificadora: string;
  fechaVigencia: string | null;
  vencida: boolean;
}

export interface DistribucionSector {
  sector: string;
  cantidad: number;
  porcentaje: number;
}

export interface ResenaVerificada {
  calificacion: number;
  comentario: string;
  fechaCalificacion: string;
}

export interface PerfilPublicoAuditorResponse {
  auditorId: string;
  nombre: string;
  fotoPerfil: string | null;
  descripcionProfesional: string | null;
  provincia: string | null;
  especialidades: string[];
  certificaciones: CertificacionPublica[];
  disponible: boolean;
  calificacionPromedio: number | null;
  totalResenas: number | null;
  auditoriasCompletadas: number | null;
  tiempoPromedioRespuestaDias: number | null;
  distribucionSectores: DistribucionSector[];
  resenas: ResenaVerificada[];
}
