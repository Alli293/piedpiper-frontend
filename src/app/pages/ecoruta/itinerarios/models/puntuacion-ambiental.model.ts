export interface PuntuacionAmbientalResponse {
  puntuacionTotal: number;
  componenteCertificaciones: number;
  componenteIma: number;
  componenteBenchmark: number;
  cantidadCertificacionesActivas: number;
  estimado: boolean;
}

export interface CertificacionActiva {
  id: string;
  nombre: string;
  fechaEmision: string; // ISO 8601
}
