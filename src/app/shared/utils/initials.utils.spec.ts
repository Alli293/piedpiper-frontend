import { initialsFrom, userInitialsFrom } from './initials.utils';

describe('initialsFrom', () => {
  it('toma la primera letra de la primera y la última palabra', () => {
    expect(initialsFrom('Café del Valle S.A.')).toBe('CA');
  });

  it('toma las dos primeras letras cuando el valor tiene una sola palabra', () => {
    expect(initialsFrom('Empresa')).toBe('EM');
  });

  it('retorna US para un valor vacío', () => {
    expect(initialsFrom('')).toBe('US');
  });

  it('toma la parte antes de la arroba en un correo', () => {
    expect(initialsFrom('ana.gomez@correo.com')).toBe('AG');
  });

  it('trata puntos, guiones y guiones bajos como separadores de palabra', () => {
    expect(initialsFrom('empresa_de-prueba.oficial')).toBe('EO');
  });

  it('conserva acentos y los pasa a mayúscula', () => {
    expect(initialsFrom('árbol frondoso')).toBe('ÁF');
  });

  it('retorna US cuando el valor solo tiene separadores', () => {
    expect(initialsFrom('...')).toBe('US');
  });
});

describe('userInitialsFrom', () => {
  it('toma la primera letra del nombre y del apellido', () => {
    expect(userInitialsFrom('Carolina Maria', 'Vindas Rodríguez')).toBe('CV');
  });

  it('ignora segundos nombres y segundos apellidos', () => {
    expect(userInitialsFrom('Ana Beatriz', 'Gómez Solís')).toBe('AG');
  });

  it('retorna US cuando nombre y apellidos están vacíos', () => {
    expect(userInitialsFrom('', '')).toBe('US');
  });

  it('usa la inicial disponible cuando falta uno de los dos campos', () => {
    expect(userInitialsFrom('Carolina', '')).toBe('C');
  });

  it('ignora espacios en blanco alrededor del nombre', () => {
    expect(userInitialsFrom('  Carolina  ', '  Vindas  ')).toBe('CV');
  });
});
