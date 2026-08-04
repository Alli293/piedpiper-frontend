export type TipoCertificacion = 'INICIAL' | 'RENOVACION';

export type EstadoSolicitudAuditoria =
  'SOLICITUD_ENVIADA' | 'OBSERVACIONES_PENDIENTES' | 'CERTIFICACION_EMITIDA';

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
  estado: EstadoSolicitudAuditoria;
  fechaCreacion: string;
  documentos: DocumentoSolicitudAuditoria[];
}

/** Valores que acepta el backend en el cuerpo del POST: su conversión es case-insensitive. */
export type OrigenAsignacionRequest = 'manual' | 'recomendacion_ia';

/** Valores que devuelve el backend: Jackson serializa el enum en mayúsculas. */
export type OrigenAsignacion = 'MANUAL' | 'RECOMENDACION_IA';

export interface AsignarAuditorRequest {
  idAuditor: string;
  origenAsignacion: OrigenAsignacionRequest;
}

/** Datos del auditor que devuelve el backend anidados en la solicitud. No incluye foto: el perfil
 * vive en otro dominio, así que la pantalla cae a las iniciales cuando no viene del directorio. */
export interface AuditorAsignado {
  id: string;
  nombre: string;
}

/** Solicitud devuelta por POST /auditorias/{id}/auditor: el estado no cambia, solo se agrega el auditor. */
export interface SolicitudAuditoriaAsignada extends SolicitudAuditoria {
  auditor: AuditorAsignado | null;
  origenAsignacion: OrigenAsignacion | null;
  fechaAsignacion: string | null;
}

export const MAXIMO_DOCUMENTOS_SOLICITUD = 10;
export const MAXIMO_BYTES_DOCUMENTO = 15 * 1024 * 1024;
export const MAXIMO_MESES_PERIODO = 12;
export const MAXIMO_CARACTERES_DESCRIPCION = 500;
