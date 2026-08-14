import { AlternativaDTO } from './alternativas.model';

export type TipoRecomendacion = 'ACTIVIDAD_ALTERNATIVA' | 'ESTABLECIMIENTO' | 'REDISTRIBUCION';

export interface RecomendacionAmbiental {
  tipo: TipoRecomendacion;
  actividadId: string | null;
  actividadNombre: string;
  descripcion: string;
  incrementoEstimado: number;
  alternativa: AlternativaDTO | null;
  categoriaTuristica: string | null;
  provincia: string | null;
}

export interface RecomendacionesResponse {
  recomendaciones: RecomendacionAmbiental[];
  mensaje: string | null;
}
