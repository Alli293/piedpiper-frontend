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
