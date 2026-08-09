import { capitalizar, esCostaRica, nombrePais } from './empresa-catalogos.utils';

describe('nombrePais', () => {
  it('devuelve el nombre completo para un código conocido', () => {
    expect(nombrePais('CR')).toBe('Costa Rica');
  });

  it('es insensible a mayúsculas/minúsculas', () => {
    expect(nombrePais('cr')).toBe('Costa Rica');
  });

  it('devuelve el código sin cambios si no está en el catálogo', () => {
    expect(nombrePais('ZZ')).toBe('ZZ');
  });

  it('devuelve cadena vacía para un valor vacío', () => {
    expect(nombrePais('')).toBe('');
    expect(nombrePais(null)).toBe('');
    expect(nombrePais(undefined)).toBe('');
  });
});

describe('esCostaRica', () => {
  it('es verdadero para CR en cualquier capitalización', () => {
    expect(esCostaRica('CR')).toBe(true);
    expect(esCostaRica('cr')).toBe(true);
  });

  it('es falso para otros países o valores vacíos', () => {
    expect(esCostaRica('MX')).toBe(false);
    expect(esCostaRica(null)).toBe(false);
  });
});

describe('capitalizar', () => {
  it('pasa a mayúscula solo la primera letra', () => {
    expect(capitalizar('AGROINDUSTRIA')).toBe('Agroindustria');
  });

  it('deja intacta una palabra ya capitalizada', () => {
    expect(capitalizar('Hotelería')).toBe('Hotelería');
  });

  it('devuelve cadena vacía para un valor vacío', () => {
    expect(capitalizar('')).toBe('');
    expect(capitalizar(undefined)).toBe('');
  });
});
