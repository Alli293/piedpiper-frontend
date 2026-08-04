import { PROVINCIA_OPTIONS } from '../../models/preferencias-viaje.model';
import { ItinerarioActividad } from '../models/itinerario.model';

function etiquetaProvincia(codigo: string): string {
  return PROVINCIA_OPTIONS.find((option) => option.value === codigo)?.label ?? codigo;
}

/**
 * Deriva una etiqueta de ruta a partir de las provincias de las actividades de un día, ya que el
 * backend no expone un origen/destino explícito por día. Ignora actividades sin provincia válida.
 * Si todas las provincias válidas son la misma, se muestra una sola; si difieren, se muestra la
 * primera y la última encontradas en el orden dado (no una lista deduplicada completa).
 */
export function derivarEtiquetaRuta(actividades: ItinerarioActividad[]): string {
  const provincias = actividades
    .map((actividad) => actividad.provincia)
    .filter((provincia): provincia is string => !!provincia && provincia.trim().length > 0);

  if (provincias.length === 0) {
    return '';
  }

  const primera = provincias[0];
  const ultima = provincias[provincias.length - 1];

  return primera === ultima
    ? etiquetaProvincia(primera)
    : `${etiquetaProvincia(primera)} → ${etiquetaProvincia(ultima)}`;
}
