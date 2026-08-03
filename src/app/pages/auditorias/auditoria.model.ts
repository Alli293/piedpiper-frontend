export type TipoCertificacion = 'INICIAL' | 'RENOVACION';

export interface NuevaSolicitudAuditoriaRequest {
  periodoInicio: string;
  periodoFin: string;
  descripcionSolicitud: string | null;
}

export interface DocumentoSolicitudAuditoria {
  id: string;
  nombreArchivo: string;
  tamanioBytes: number;
}

export interface SolicitudAuditoria {
  id: string;
  tipoCertificacion: TipoCertificacion;
  periodoInicio: string;
  periodoFin: string;
  descripcionSolicitud: string | null;
  estado: string;
  fechaCreacion: string;
  documentos: DocumentoSolicitudAuditoria[];
}

export const MAXIMO_DOCUMENTOS_SOLICITUD = 10;
export const MAXIMO_BYTES_DOCUMENTO = 15 * 1024 * 1024;
export const MAXIMO_MESES_PERIODO = 12;
export const MAXIMO_CARACTERES_DESCRIPCION = 500;
