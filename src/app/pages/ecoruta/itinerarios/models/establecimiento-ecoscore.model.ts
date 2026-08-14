import { PuntuacionAmbientalResponse } from './puntuacion-ambiental.model';

export interface EstablecimientoEcoScore {
  nombreEstablecimiento: string;
  // Null cuando el establecimiento (nombre generado por la IA) no matcheó con ninguna empresa
  // registrada — ver EcoRutaItinerarioService.extraerEstablecimientosRankeados en el backend.
  // Cuando existe, se usa para pedir el banner de origen a EstablecimientoBannerService (PP-95).
  empresaId: string | null;
  puntuacionAmbiental: PuntuacionAmbientalResponse;
}
