import { PuntuacionAmbientalResponse } from './puntuacion-ambiental.model';

export interface EstablecimientoEcoScore {
  nombreEstablecimiento: string;
  puntuacionAmbiental: PuntuacionAmbientalResponse;
}
