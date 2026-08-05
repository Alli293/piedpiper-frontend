export function formatCurrency(monto: number, moneda: string): string {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: moneda }).format(monto);
}
