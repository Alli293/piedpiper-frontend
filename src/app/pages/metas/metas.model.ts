/** Alta de una meta de reducción (PP-78). */
export interface CrearMetaRequest {
  readonly nombreMeta: string;
  readonly valorObjetivoHuellaT: number;
  /** Formato 'YYYY-MM-DD'. */
  readonly fechaLimite: string;
}

/**
 * Una meta de reducción con su progreso calculado (PP-78). `huellaActualT`
 * y `progresoPorcentaje` se recalculan en el backend contra el período
 * seleccionado del dashboard — no son valores fijos de la meta.
 *
 * `progresoPorcentaje` puede superar 100 (huella actual ya rebasó el
 * objetivo); el componente que lo muestra recorta la barra visual a 100
 * pero sigue mostrando el número real.
 */
export interface MetaReduccion {
  readonly id: string;
  readonly nombreMeta: string;
  readonly valorObjetivoHuellaT: number;
  /** Formato 'YYYY-MM-DD'. */
  readonly fechaLimite: string;
  readonly huellaActualT: number;
  readonly progresoPorcentaje: number;
  readonly vencida: boolean;
  readonly fechaCreacion: string;
}
