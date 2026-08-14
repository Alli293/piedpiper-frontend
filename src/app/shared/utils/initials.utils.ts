export function initialsFrom(value: string): string {
  if (!value) return 'US';

  const base = value.includes('@') ? value.split('@')[0] : value;
  const parts = base
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const initials =
    parts.length > 1
      ? `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`
      : `${parts[0]?.[0] ?? ''}${parts[0]?.[1] ?? ''}`;

  return initials.toUpperCase() || 'US';
}

/**
 * Primera letra de `nombre` + primera letra de `apellidos`, ignorando
 * segundos nombres o segundos apellidos (a diferencia de `initialsFrom`,
 * que toma la primera y última palabra).
 */
export function userInitialsFrom(nombre: string, apellidos: string): string {
  const inicialNombre = primeraLetra(nombre);
  const inicialApellidos = primeraLetra(apellidos);

  return `${inicialNombre}${inicialApellidos}` || 'US';
}

function primeraLetra(value: string): string {
  const primeraPalabra = value?.trim().split(/\s+/)[0] ?? '';
  return primeraPalabra ? primeraPalabra[0].toUpperCase() : '';
}

/**
 * Primera letra del nombre + primera letra del primer apellido a partir de
 * un nombre completo en un solo string (convención CR: nombre(s) seguido de
 * dos apellidos). Con 3+ palabras asume que las últimas dos son los
 * apellidos y usa la primera de esas dos como "primer apellido", ignorando
 * segundos nombres — p. ej. "Juan Carlos Pérez Mora" da "JP", no "JC" ni
 * "JM". Con 2 palabras las trata como nombre + apellido único. Con 1 sola
 * palabra usa sus dos primeras letras, igual que `initialsFrom`.
 */
export function initialsFromNombreCompleto(nombreCompleto: string): string {
  const palabras = nombreCompleto?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (palabras.length === 0) return 'US';
  if (palabras.length === 1) {
    return `${palabras[0][0]}${palabras[0][1] ?? ''}`.toUpperCase();
  }

  const indicePrimerApellido = Math.max(1, palabras.length - 2);
  return `${palabras[0][0]}${palabras[indicePrimerApellido][0]}`.toUpperCase();
}
