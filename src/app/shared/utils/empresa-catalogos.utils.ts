export const PAISES: ReadonlyArray<{ codigo: string; nombre: string }> = [
  { codigo: 'CR', nombre: 'Costa Rica' },
  { codigo: 'GT', nombre: 'Guatemala' },
  { codigo: 'HN', nombre: 'Honduras' },
  { codigo: 'SV', nombre: 'El Salvador' },
  { codigo: 'NI', nombre: 'Nicaragua' },
  { codigo: 'PA', nombre: 'Panamá' },
  { codigo: 'MX', nombre: 'México' },
  { codigo: 'CO', nombre: 'Colombia' },
];

export function nombrePais(codigo: string | null | undefined): string {
  if (!codigo) return '';
  const pais = PAISES.find((p) => p.codigo === codigo.toUpperCase());
  return pais?.nombre ?? codigo;
}

export function esCostaRica(codigo: string | null | undefined): boolean {
  return (codigo ?? '').toUpperCase() === 'CR';
}

export function capitalizar(valor: string | null | undefined): string {
  if (!valor) return '';
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}
