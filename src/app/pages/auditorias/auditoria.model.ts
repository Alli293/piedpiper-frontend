export type TipoCertificacion = 'INICIAL' | 'RENOVACION';

export type EstadoSolicitudAuditoria =
  | 'SOLICITUD_ENVIADA'
  | 'AUDITOR_ASIGNADO'
  | 'EN_REVISION'
  | 'REPORTE_CARGADO'
  | 'OBSERVACIONES_PENDIENTES'
  | 'CERTIFICACION_EMITIDA';

export type EventoTransicionAuditoria =
  | 'SOLICITUD_CREADA'
  | 'AUDITOR_ACEPTA'
  | 'INICIO_REVISION'
  | 'REPORTE_CARGADO'
  | 'RESULTADO_APROBADA'
  | 'RESULTADO_OBSERVACIONES'
  | 'AUDITOR_RECHAZA'
  | 'VENCIDA_POR_NO_RESPUESTA';

export type ActorTransicionAuditoria = 'EMPRESA' | 'AUDITOR' | 'SISTEMA';

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

export interface TransicionEstadoAuditoria {
  estadoAnterior: EstadoSolicitudAuditoria;
  estadoNuevo: EstadoSolicitudAuditoria;
  evento: EventoTransicionAuditoria;
  actor: ActorTransicionAuditoria;
  /** Ya resuelto por el servidor: para las transiciones automáticas llega "Proceso automático". */
  responsable: string;
  fecha: string;
}

/** Respuesta de GET /auditorias/{id}: la solicitud con su línea de tiempo completa. */
export interface DetalleSolicitudAuditoria extends SolicitudAuditoriaAsignada {
  estadoDescripcion: string;
  fechaAceptacion: string | null;
  reporteAuditoria: DocumentoSolicitudAuditoria | null;
  fechaAuditoriaRealizada: string | null;
  fechaCargaReporte: string | null;

  /** Motivo del último rechazo. Sigue visible aunque la asignación ya se haya liberado. */
  motivoRechazo: string | null;

  fechaRechazo: string | null;
  nombreEmpresa: string | null;
  historial: TransicionEstadoAuditoria[];
}

/**
 * Pasos que la pantalla dibuja siempre, en orden, aunque el historial todavía no los alcance: el
 * diseño muestra el recorrido completo con los pendientes en gris para que se vea cuánto falta.
 */
export const PASOS_AUDITORIA: readonly EstadoSolicitudAuditoria[] = [
  'SOLICITUD_ENVIADA',
  'AUDITOR_ASIGNADO',
  'EN_REVISION',
  'REPORTE_CARGADO',
  'CERTIFICACION_EMITIDA',
];

export const INTERVALO_SONDEO_DETALLE_MS = 15_000;

/** Fila de un listado de solicitudes. Sin documentos ni historial: para eso está el detalle. */
export interface ResumenSolicitudAuditoria {
  id: string;
  tipoCertificacion: TipoCertificacion;
  periodoInicio: string;
  periodoFin: string;
  estado: EstadoSolicitudAuditoria;
  estadoDescripcion: string;
  fechaCreacion: string;
  nombreEmpresa: string | null;
  idAuditor: string | null;
  nombreAuditor: string | null;
  fechaAsignacion: string | null;
  fechaAceptacion: string | null;
  cantidadDocumentos: number;
}

/** Valores que acepta el backend en el cuerpo del POST: su conversión es case-insensitive. */
export type DecisionAuditorRequest = 'aceptada' | 'rechazada';

export interface ResponderDecisionRequest {
  decision: DecisionAuditorRequest;
  motivoRechazo?: string;
}

export type ResultadoAuditoriaRequest = 'aprobada' | 'observaciones';

/** Valor que devuelve el backend en el detalle: Jackson serializa el enum en mayúsculas. */
export type ResultadoAuditoria = 'APROBADA' | 'OBSERVACIONES';

/**
 * Los dos campos son condicionales y excluyentes entre sí: al aprobar viaja la vigencia de la
 * certificación, y al devolver con observaciones viaja el texto. Enviar el que no corresponde no
 * rompe nada —el servidor ignora el sobrante— pero omitir el que sí corresponde devuelve 422.
 */
export interface EmitirResultadoAuditoriaRequest {
  resultado: ResultadoAuditoriaRequest;
  observaciones?: string;
  fechaVencimientoCert?: string;
}

export const MINIMO_CARACTERES_OBSERVACIONES = 20;
export const MAXIMO_CARACTERES_OBSERVACIONES = 1000;

export const MINIMO_CARACTERES_MOTIVO_RECHAZO = 10;
export const MAXIMO_CARACTERES_MOTIVO_RECHAZO = 300;

/** Debe mantenerse alineado con el default backend `auditoria.expiracion-asignacion-horas`. */
export const HORAS_PARA_RESPONDER = 120;

export const MAXIMO_DOCUMENTOS_SOLICITUD = 10;
export const MAXIMO_BYTES_DOCUMENTO = 15 * 1024 * 1024;
export const MAXIMO_BYTES_REPORTE_AUDITORIA = 25 * 1024 * 1024;
export const MAXIMO_MESES_PERIODO = 12;
export const MAXIMO_CARACTERES_DESCRIPCION = 500;
