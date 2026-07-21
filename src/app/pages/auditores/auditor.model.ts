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
