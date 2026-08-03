const RUTA_BADGE_POR_TIPO: Record<string, string> = {
  INVENTARIO_GEI: '/images/badges/inventario-gei.svg',
  REDUCCION_EMISIONES: '/images/badges/reduccion-emisiones.svg',
  REDUCCION_PLUS: '/images/badges/reduccion-plus.svg',
  CARBONO_NEUTRAL: '/images/badges/carbono-neutral.svg',
  CARBONO_NEUTRAL_PLUS: '/images/badges/carbono-neutral-plus.svg',
  ADAPTACION_CLIMATICA: '/images/badges/adaptacion-climatica.svg',
  HUELLA_PRODUCTO: '/images/badges/huella-producto.svg',
};

/**
 * Ruta de la insignia visual por tipo de certificacion. Los archivos todavia
 * no existen (arte pendiente, pista aparte de PP-68): la pagina cae al icono
 * generico de "insignias" ante un 404 de esta ruta, asi que agregar los
 * archivos en el futuro no requiere ningun cambio de codigo.
 */
export function rutaBadge(tipo: string): string | null {
  return RUTA_BADGE_POR_TIPO[tipo] ?? null;
}
