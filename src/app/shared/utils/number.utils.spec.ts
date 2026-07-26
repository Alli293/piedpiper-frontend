import { countDecimals } from './number.utils';

describe('countDecimals', () => {
  it('retorna 0 para un entero', () => {
    expect(countDecimals(42)).toBe(0);
  });

  it('cuenta los decimales de un número con punto decimal', () => {
    expect(countDecimals(1.234)).toBe(3);
  });

  it('retorna 0 para cero', () => {
    expect(countDecimals(0)).toBe(0);
  });

  it('cuenta un solo decimal', () => {
    expect(countDecimals(2.5)).toBe(1);
  });

  it('retorna 0 para un número negativo entero', () => {
    expect(countDecimals(-10)).toBe(0);
  });

  it('cuenta los decimales de un número negativo', () => {
    expect(countDecimals(-1.25)).toBe(2);
  });
});
