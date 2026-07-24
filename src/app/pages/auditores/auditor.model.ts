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
  auditoriasCompletadas: number;
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
