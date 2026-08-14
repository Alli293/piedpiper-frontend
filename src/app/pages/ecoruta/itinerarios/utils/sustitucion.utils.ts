import { AlternativaDTO, SustitucionRequest } from '../models/alternativas.model';

/**
 * Arma el body de `PUT .../actividades/{id}/sustituir` (y `.../recomendaciones/{id}/aplicar`,
 * que consume el mismo shape) a partir de una alternativa sugerida. Compartido entre
 * RefinamientoChatComponent y RecomendacionesAmbientalesComponent para no duplicar el mapeo
 * campo por campo en los dos componentes (FRONTEND_STANDARDS §2).
 */
export function crearSustitucionRequest(
  alternativa: AlternativaDTO,
  categoriaTuristica: string,
  provincia: string
): SustitucionRequest {
  return {
    nombre: alternativa.nombre,
    descripcion: alternativa.descripcion,
    costoAproximado: alternativa.costoAproximado,
    moneda: alternativa.moneda,
    establecimientoRecomendado: alternativa.establecimientoRecomendado,
    ecoScore: alternativa.ecoScore,
    categoriaTuristica,
    provincia,
  };
}
