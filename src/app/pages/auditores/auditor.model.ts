export type OrdenamientoAuditores = 'CALIFICACION' | 'AUDITORIAS_COMPLETADAS' | 'TIEMPO_RESPUESTA';

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

export interface FiltrosDirectorio {
  terminoBusqueda: string;
  pagina: number;
  ordenamiento: OrdenamientoAuditores;
}

export const TAMANIO_PAGINA_DIRECTORIO = 12;
export const LONGITUD_MINIMA_BUSQUEDA = 2;
export const LONGITUD_MAXIMA_BUSQUEDA = 100;
