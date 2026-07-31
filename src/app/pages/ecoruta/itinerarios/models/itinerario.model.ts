export interface ItinerarioActividad {
  nombre: string;
  descripcion: string | null;
  horario: string;
  duracionMinutos: number;
  costoAproximado: number | null;
  moneda: string | null;
  establecimientoRecomendado: string | null;
  provincia: string;
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
  fechaGeneracion: string;
  generadoParcial: boolean;
  mensajeParcial: string | null;
  dias: ItinerarioDia[];
}
