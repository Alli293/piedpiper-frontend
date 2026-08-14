import { BadgeVariant } from '../../../../shared/components/badge/badge.component';

export type ClaveClasificacion = 'excelente' | 'buena' | 'moderada' | 'mejorable';

export interface ClasificacionInfo {
  texto: string;
  clave: ClaveClasificacion;
}

/** Compartido entre la vista de detalle del itinerario y "Mis itinerarios" — mismos textos/colores. */
export const INFO_POR_CLASIFICACION: Record<string, ClasificacionInfo> = {
  EXCELENTE: { texto: 'Excelente', clave: 'excelente' },
  BUENA: { texto: 'Buena', clave: 'buena' },
  MODERADA: { texto: 'Moderada', clave: 'moderada' },
  MEJORABLE: { texto: 'Mejorable', clave: 'mejorable' },
};

const VARIANTE_POR_CLASIFICACION: Record<string, BadgeVariant> = {
  EXCELENTE: 'success',
  BUENA: 'success',
  MODERADA: 'warning',
  MEJORABLE: 'danger',
};

export function varianteDeClasificacion(clasificacion: string | null): BadgeVariant {
  if (!clasificacion) return 'neutral';
  return VARIANTE_POR_CLASIFICACION[clasificacion] ?? 'neutral';
}
