import { PROVINCIA_OPTIONS } from '../../models/preferencias-viaje.model';

/** Compartido entre la vista de detalle del itinerario y "Mis itinerarios". */
export function etiquetaProvincia(codigo: string): string {
  return PROVINCIA_OPTIONS.find((option) => option.value === codigo)?.label ?? codigo;
}
