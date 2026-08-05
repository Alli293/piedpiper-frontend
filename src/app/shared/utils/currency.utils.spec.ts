import { formatCurrency } from './currency.utils';

describe('formatCurrency', () => {
  it('delega en Intl.NumberFormat con locale es-CR y la moneda dada', () => {
    const esperado = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD' }).format(
      12.5
    );

    expect(formatCurrency(12.5, 'USD')).toBe(esperado);
  });

  it('incluye el símbolo de colones al formatear CRC', () => {
    expect(formatCurrency(6500, 'CRC')).toContain('₡');
  });

  it('formatea USD en locale es-CR (el símbolo ISO "USD", no "$", por ambigüedad de moneda)', () => {
    // Intl con locale es-CR antepone el código ISO en vez de "$" para monedas
    // extranjeras — "$" en Costa Rica es ambiguo (podría ser colones o dólares).
    expect(formatCurrency(12, 'USD')).toContain('USD');
  });
});
