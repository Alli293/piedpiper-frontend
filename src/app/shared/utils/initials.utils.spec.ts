import { initialsFrom, initialsFromNombreCompleto, userInitialsFrom } from './initials.utils';

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

describe('initialsFromNombreCompleto', () => {
  it('con nombre y dos apellidos, ignora el segundo nombre', () => {
    expect(initialsFromNombreCompleto('Juan Carlos Pérez Mora')).toBe('JP');
  });

  it('con un nombre y dos apellidos', () => {
    expect(initialsFromNombreCompleto('Juan Pérez Mora')).toBe('JP');
  });

  it('con nombre y un solo apellido', () => {
    expect(initialsFromNombreCompleto('Juan Pérez')).toBe('JP');
  });

  it('con una sola palabra toma sus dos primeras letras', () => {
    expect(initialsFromNombreCompleto('Juan')).toBe('JU');
  });

  it('con una sola palabra de una letra no revienta', () => {
    expect(initialsFromNombreCompleto('J')).toBe('J');
  });

  it('retorna US para un valor vacío', () => {
    expect(initialsFromNombreCompleto('')).toBe('US');
  });

  it('retorna US cuando el valor solo tiene espacios', () => {
    expect(initialsFromNombreCompleto('   ')).toBe('US');
  });

  it('ignora espacios repetidos y a los extremos', () => {
    expect(initialsFromNombreCompleto('  Juan   Carlos  Pérez   Mora  ')).toBe('JP');
  });

  it('conserva acentos y los pasa a mayúscula', () => {
    expect(initialsFromNombreCompleto('ana gómez')).toBe('AG');
  });

  it('con tres nombres y dos apellidos sigue tomando el primer nombre y el primer apellido', () => {
    expect(initialsFromNombreCompleto('María José del Carmen Solís Vega')).toBe('MS');
  });
});
