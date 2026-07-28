export type PeriodoDashboard = 'mes_actual' | 'trimestre' | 'año';

export interface ResumenHuellaDashboardResponse {
  readonly periodoSeleccionado: PeriodoDashboard;
  readonly huellaTotalT: number;
  readonly variacionPorcentual: number | null;
  readonly tieneDatos: boolean;
}

export type NivelInsigniaEmpresa = 'bronce' | 'plata' | 'oro';

export interface InsigniaEmpresa {
  readonly idInsignia: number;
  readonly nivelInsignia: NivelInsigniaEmpresa;
  readonly nombre: string;
  readonly descripcion: string;
  readonly fechaObtencion: string;
}
