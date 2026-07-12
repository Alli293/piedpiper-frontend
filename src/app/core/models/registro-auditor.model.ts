export interface RegistroAuditorCorreoRequest {
  nombre: string | null;
  apellidos: string | null;
  email: string | null;
  contrasena: string | null;
  aceptaTerminos: boolean | null;
}

export interface RegistroAuditorRequest {
  nombreCompleto: string;
  email: string;
  contrasena: string;
  numeroCertificacion: string;
  entidadCertificadoraId: number | null;
  entidadCertificadoraOtra: string | null;
  fechaVigenciaCert: string; // ISO 8601 date
  aniosExperiencia: number;
  aceptaTerminos: boolean;
}

export interface RegistroAuditorResponse {
  mensaje: string;
  email: string;
}

export interface VerificacionEmailResponse {
  estado: string;
  mensaje: string;
  puedeReenviar?: boolean;
}

export interface ReenvioVerificacionRequest {
  email: string;
}
