export type PeriodoDashboard = 'mes_actual' | 'trimestre' | 'año';

export interface ResumenHuellaDashboardResponse {
  readonly periodoSeleccionado: PeriodoDashboard;
  readonly huellaTotalT: number;
  readonly variacionPorcentual: number | null;
  readonly tieneDatos: boolean;
}

export interface ResumenCertificacionesDashboardResponse {
  readonly activas: number;
  readonly proximasAVencer: number;
  readonly vencidas: number;
}

export type UrgenciaVencimiento = '90_dias' | '30_dias' | '7_dias' | 'vencida';

export interface CertificacionVencimiento {
  readonly id: string;
  readonly nombre: string;
  readonly urgencia: UrgenciaVencimiento;
}

export interface CalendarioVencimientosResponse {
  readonly mesVisualizado: string;
  readonly vencimientosPorFecha: Record<string, CertificacionVencimiento[]>;
}

export type NivelInsigniaEmpresa = 'bronce' | 'plata' | 'oro';

export interface InsigniaEmpresa {
  readonly idInsignia: number;
  readonly nivelInsignia: NivelInsigniaEmpresa;
  readonly nombre: string;
  readonly descripcion: string;
  readonly fechaObtencion: string;
}
