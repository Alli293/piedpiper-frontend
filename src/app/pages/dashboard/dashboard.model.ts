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
