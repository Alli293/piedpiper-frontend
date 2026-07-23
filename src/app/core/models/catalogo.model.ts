/**
 * Contrato estándar para ítems de catálogo (alineado con PP-51/52).
 * El backend devuelve objetos con valor técnico (enum name) y etiqueta legible.
 */
export interface CatalogoItem {
  valor: string;
  etiqueta: string;
}
