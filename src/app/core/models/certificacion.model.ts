export interface CertificacionResumen {
  id: string;
  idAuditoria: string;
  idEmpresa: string;
  idAuditor: string;
  tipo: string;
  nombreCertificacion: string;
  fechaEmision: string;
  fechaVencimiento: string;
  // No es un union: la empresa no es dueña de este enum del backend, que hoy
  // solo tiene ACTIVA (revocar aun no existe como accion).
  estado: string;
  // "Vencida" no es un estado persistido: se calcula comparando
  // fechaVencimiento contra hoy en cada consulta.
  vigente: boolean;
  urlVerificacion: string;
}

export interface Certificacion extends CertificacionResumen {
  recienEmitida: boolean;
}
