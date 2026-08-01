export type PeriodoDashboard = 'mes_actual' | 'trimestre' | 'año';

export interface ResumenHuellaDashboardResponse {
  readonly periodoSeleccionado: PeriodoDashboard;
  readonly huellaTotalT: number;
  readonly variacionPorcentual: number | null;
  readonly tieneDatos: boolean;
}

/** Conteos del bloque "Estado de certificaciones" (PP-74). Mutuamente excluyentes. */
export interface ResumenCertificacionesDashboardResponse {
  readonly activas: number;
  readonly proximasAVencer: number;
  readonly vencidas: number;
}

/** Mismos códigos que TipoAlerta en el backend (PP-70): '90_dias' | '30_dias' | '7_dias'. */
export type UrgenciaVencimiento = '90_dias' | '30_dias' | '7_dias';

export interface CertificacionVencimiento {
  readonly id: string;
  readonly nombre: string;
  readonly urgencia: UrgenciaVencimiento;
}

/** Calendario de vencimientos del dashboard (PP-77). */
export interface CalendarioVencimientosResponse {
  /** Mes efectivamente devuelto por el backend, formato 'YYYY-MM' (puede diferir del solicitado si era inválido). */
  readonly mesVisualizado: string;
  /** Clave: fecha 'YYYY-MM-DD'. Solo incluye días que tienen al menos un vencimiento. */
  readonly vencimientosPorFecha: Record<string, CertificacionVencimiento[]>;
}
