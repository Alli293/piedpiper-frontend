export interface PerfilPublicoDTO {
  nombreEmpresa: string;
  logoUrl: string | null;
  sectorIndustrial: string;
  pais: string;
  nivelEcologico: string;
  fechaActualizacionNivel: string | null; // ISO 8601 UTC
  certificacionesVigentes: number;
  insigniasActivas: number;
}

export interface CertificacionPublica {
  id: string;
  tipo: string;
  nombreCertificacion: string;
  fechaEmision: string;
  fechaVencimiento: string;
  // Se mantiene como string (no un union) para tolerar valores nuevos que el
  // backend agregue (VENCIDA, REVOCADA) sin romper la compilacion: deben caer
  // en el estado neutral por defecto, no en un error de tipos.
  estado: string;
}

export interface BusquedaPerfilPublicoDTO {
  nombreEmpresa: string;
  slug: string;
  sectorIndustrial: string;
  nivelEcologico: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type { InsigniaEmpresa, NivelInsigniaEmpresa } from '../../core/empresa/empresa.models';
