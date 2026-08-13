export type OrdenamientoAuditores = 'CALIFICACION' | 'AUDITORIAS_COMPLETADAS' | 'TIEMPO_RESPUESTA';

export const ORDENAMIENTOS_AUDITORES: readonly OrdenamientoAuditores[] = [
  'CALIFICACION',
  'AUDITORIAS_COMPLETADAS',
  'TIEMPO_RESPUESTA',
];

export function esOrdenamientoValido(valor: string): valor is OrdenamientoAuditores {
  return (ORDENAMIENTOS_AUDITORES as readonly string[]).includes(valor);
}

export type CalificacionMinima = '' | '3' | '4' | '5';

export const CALIFICACIONES_MINIMAS: readonly CalificacionMinima[] = ['', '3', '4', '5'];

export function esCalificacionValida(valor: string): valor is CalificacionMinima {
  return (CALIFICACIONES_MINIMAS as readonly string[]).includes(valor);
}

export interface AuditorResumen {
  auditorId: string;
  nombre: string;
  fotoPerfil: string | null;
  especialidadesPrincipales: string[];
  calificacionPromedio: number | null;
  totalResenas: number;
  disponible: boolean;
  auditoriasCompletadas: number | null;
  aniosExperiencia: number | null;
  provincia: string | null;
}

export interface PaginaAuditores {
  contenido: AuditorResumen[];
  totalResultados: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface CatalogoItem {
  valor: string;
  etiqueta: string;
}

export interface FiltrosDirectorio {
  terminoBusqueda: string;
  especialidades: string[];
  zonaGeografica: string | null;
  calificacionMinima: number | null;
  soloDisponibles: boolean;
  pagina: number;
  ordenamiento: OrdenamientoAuditores;
}

export const TAMANIO_PAGINA_DIRECTORIO = 12;
export const LONGITUD_MINIMA_BUSQUEDA = 2;
export const LONGITUD_MAXIMA_BUSQUEDA = 100;

/**
 * Filtros de la recomendación con IA (PP-57). El sector no viaja: el backend lo resuelve desde el
 * token del administrador, así que el cliente no lo puede manipular.
 */
export interface FiltrosRecomendacion {
  tipoAuditoria: string;
  especialidadBuscada: string;
  zonaGeografica: string;
  soloDisponibles: boolean;
}

/**
 * Una tarjeta de auditor recomendado. `justificacion` llega nula cuando la IA no pudo generarla:
 * la tarjeta se muestra igual, solo sin ese campo.
 */
export interface AuditorRecomendado {
  auditorId: string;
  nombre: string;
  fotoPerfil: string | null;
  especialidades: string[];
  calificacionPromedio: number | null;
  disponible: boolean;
  auditoriasCompletadas: number;
  justificacion: string | null;
}

/**
 * `iaDisponible` va aparte de mirar si las justificaciones vienen nulas porque son cosas distintas:
 * en false significa que la IA falló y hay que mostrar el aviso; en true con la lista vacía
 * significa que no hubo candidatos y la IA ni se invocó.
 */
export interface RecomendacionAuditores {
  recomendaciones: AuditorRecomendado[];
  iaDisponible: boolean;
}

export const MAXIMO_RECOMENDACIONES = 5;
