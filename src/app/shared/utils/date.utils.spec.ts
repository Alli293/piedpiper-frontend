import { toIsoDateString, toSpanishMonthName, todayUtcMidnight } from './date.utils';

describe('toIsoDateString', () => {
  it('formatea una fecha UTC como yyyy-MM-dd', () => {
    expect(toIsoDateString(new Date(Date.UTC(2026, 6, 5)))).toBe('2026-07-05');
  });

  it('agrega ceros a la izquierda en mes y día', () => {
    expect(toIsoDateString(new Date(Date.UTC(2026, 0, 9)))).toBe('2026-01-09');
  });
});

describe('toSpanishMonthName', () => {
  it('retorna el nombre del mes en español', () => {
    expect(toSpanishMonthName(new Date(Date.UTC(2026, 0, 15)))).toBe('enero');
  });

  it('retorna diciembre para el último mes del año', () => {
    expect(toSpanishMonthName(new Date(Date.UTC(2026, 11, 1)))).toBe('diciembre');
  });
});

describe('todayUtcMidnight', () => {
  it('retorna la fecha de hoy sin componente de hora', () => {
    const resultado = todayUtcMidnight();

    expect(resultado.getUTCHours()).toBe(0);
    expect(resultado.getUTCMinutes()).toBe(0);
    expect(resultado.getUTCSeconds()).toBe(0);
    expect(resultado.getUTCMilliseconds()).toBe(0);
  });

  it('conserva el año, mes y día actuales (calendario local expresado en UTC)', () => {
    const ahora = new Date();
    const resultado = todayUtcMidnight();

    expect(resultado.getUTCFullYear()).toBe(ahora.getFullYear());
    expect(resultado.getUTCMonth()).toBe(ahora.getMonth());
    expect(resultado.getUTCDate()).toBe(ahora.getDate());
  });
});
