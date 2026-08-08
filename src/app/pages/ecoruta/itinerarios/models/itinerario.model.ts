import { CertificacionActiva, PuntuacionAmbientalResponse } from './puntuacion-ambiental.model';
import { EstablecimientoEcoScore } from './establecimiento-ecoscore.model';

export interface ItinerarioActividad {
  id?: string;
  nombre: string;
  descripcion: string | null;
  horario: string;
  duracionMinutos: number;
  costoAproximado: number | null;
  moneda: string | null;
  establecimientoRecomendado: string | null;
  provincia: string;
  puntuacionAmbientalEstimada?: number | null;
  puntuacionAmbiental?: PuntuacionAmbientalResponse;
  certificacionesActivas?: CertificacionActiva[];
}

export interface ItinerarioDia {
  numeroDia: number;
  fecha: string;
  actividades: ItinerarioActividad[];
}

export interface Itinerario {
  id: string;
  cantidadDias: number;
  fechaInicio: string;
  tipoViaje: string;
  estado: string;
  version: number;
  puntuacionAmbientalPreliminar: number | null;
  ecoScore: number | null;
  clasificacionAmbiental: 'EXCELENTE' | 'BUENA' | 'MODERADA' | 'MEJORABLE' | null;
  ecoScoreParcial: boolean;
  ecoScoreCalculadoEn: string | null;
  fechaGeneracion: string;
  generadoParcial: boolean;
  mensajeParcial: string | null;
  dias: ItinerarioDia[];
  establecimientosEvaluados: EstablecimientoEcoScore[] | null;
}
