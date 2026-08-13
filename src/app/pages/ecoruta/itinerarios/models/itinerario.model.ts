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
  puntuacionAmbiental?: PuntuacionAmbientalResponse;
  puntuacionAmbientalEstimada?: number | null;
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

/** Fila liviana del listado de "Mis itinerarios" (PP-89) — sin `dias` completo. */
export interface ItinerarioResumen {
  id: string;
  cantidadDias: number;
  fechaInicio: string;
  tipoViaje: string;
  ecoScore: number | null;
  clasificacionAmbiental: Itinerario['clasificacionAmbiental'];
  ecoScoreParcial: boolean;
  provinciasVisitadas: string[];
  fechaGeneracion: string;
  actualizadoEn: string;
}

/** Nombre genérico a propósito: PP-90 (favoritos, fuera de esta ronda) solo suma un campo acá. */
export interface FiltroItinerarios {
  pagina?: number;
}

/** Misma forma que la paginación de solicitudes de auditoría, para paginar igual en toda la app. */
export interface PaginaItinerarios {
  contenido: ItinerarioResumen[];
  totalResultados: number;
  paginaActual: number;
  totalPaginas: number;
  tamanioPagina: number;
}
