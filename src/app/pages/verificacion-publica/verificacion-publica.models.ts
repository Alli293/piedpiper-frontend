export type EstadoVerificacion = 'valida_vigente' | 'valida_vencida' | 'revocada';
export type CategoriaVerificacion = 'CERTIFICACION' | 'INSIGNIA';

export interface VerificacionCredencial {
  estado: EstadoVerificacion;
  categoria: CategoriaVerificacion;
  tipo: string;
  nombreCertificacion: string;
  // Solo presente cuando categoria es 'INSIGNIA'.
  nivelInsignia: string | null;
  empresa: string;
  // Solo presente cuando categoria es 'CERTIFICACION': una insignia no tiene auditor.
  auditor: string | null;
  entidadCertificadora: string;
  fechaEmision: string;
  // Solo presente cuando categoria es 'CERTIFICACION': una insignia no vence.
  fechaVencimiento: string | null;
  // Solo presente cuando estado es 'revocada'.
  fechaRevocacion: string | null;
  fechaConsulta: string;
}
