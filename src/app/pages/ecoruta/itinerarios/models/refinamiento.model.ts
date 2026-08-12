import { Itinerario } from './itinerario.model';

export interface MensajeConversacion {
  rol: 'USUARIO' | 'ASISTENTE';
  contenido: string;
}

export interface ConversacionContexto {
  itinerarioId: string;
  historialMensajes: MensajeConversacion[];
  versionItinerario: number;
}

export interface RefinamientoRequest {
  mensajeUsuario: string;
  contextoConversacional: ConversacionContexto | null;
}

export interface RefinamientoResponse {
  itinerario: Itinerario;
  respuestaAsistente: string;
  historialMensajes: MensajeConversacion[];
  actividadParaComparar: string | null;
}
