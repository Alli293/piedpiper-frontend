export type EstadoVerificacion = 'valida_vigente' | 'valida_vencida' | 'revocada';

export interface VerificacionCredencial {
  estado: EstadoVerificacion;
  tipo: string;
  nombreCertificacion: string;
  empresa: string;
  auditor: string;
  entidadCertificadora: string;
  fechaEmision: string;
  fechaVencimiento: string;
  // Solo presente cuando estado es 'revocada'.
  fechaRevocacion: string | null;
  fechaConsulta: string;
}
