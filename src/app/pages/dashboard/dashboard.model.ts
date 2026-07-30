export type PeriodoDashboard = 'mes_actual' | 'trimestre' | 'año';

export interface ResumenHuellaDashboardResponse {
  readonly periodoSeleccionado: PeriodoDashboard;
  readonly huellaTotalT: number;
  readonly variacionPorcentual: number | null;
  readonly tieneDatos: boolean;
}
