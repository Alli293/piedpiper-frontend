export interface AlternativaDTO {
  nombre: string;
  descripcion: string | null;
  ecoScore: number;
  costoAproximado: number | null;
  moneda: string | null;
  establecimientoRecomendado: string | null;
  diferenciaAmbiental: number;
  mejorDesempeno: boolean;
}

export interface ComparacionResponse {
  actividadOriginalNombre: string;
  ecoScoreOriginal: number;
  categoriaTuristica: string;
  provincia: string;
  alternativas: AlternativaDTO[];
  mensaje: string | null;
}

export interface SustitucionRequest {
  nombre: string;
  descripcion: string | null;
  costoAproximado: number | null;
  moneda: string | null;
  establecimientoRecomendado: string | null;
  ecoScore: number;
}
