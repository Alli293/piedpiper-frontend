const MONEDA_POR_DEFECTO = 'CRC';

/**
 * Formatea un monto como moneda en locale es-CR. `moneda` cae a CRC si viene vacía/nula o no es
 * un código ISO 4217 válido — `Intl.NumberFormat` lanza `RangeError` con un código inválido, y
 * el modelo tipa `moneda` como `string | null` sin garantizar que llegue siempre bien formada.
 */
export function formatCurrency(monto: number, moneda: string | null | undefined): string {
  const codigo = moneda && esCodigoMonedaValido(moneda) ? moneda : MONEDA_POR_DEFECTO;
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: codigo }).format(monto);
}

function esCodigoMonedaValido(codigo: string): boolean {
  try {
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: codigo });
    return true;
  } catch {
    return false;
  }
}
