import { EMAIL_MAX_LENGTH, EMAIL_MENSAJE, EMAIL_PATTERN } from './email.utils';

describe('EMAIL_PATTERN', () => {
  it('acepta un correo con formato válido', () => {
    expect(EMAIL_PATTERN.test('ana.gomez@correo.com')).toBe(true);
  });

  it('rechaza un correo sin arroba', () => {
    expect(EMAIL_PATTERN.test('ana.gomez-correo.com')).toBe(false);
  });

  it('rechaza un correo sin dominio', () => {
    expect(EMAIL_PATTERN.test('ana@correo')).toBe(false);
  });

  it('rechaza un correo con espacios', () => {
    expect(EMAIL_PATTERN.test('ana gomez@correo.com')).toBe(false);
  });

  it('rechaza cadena vacía', () => {
    expect(EMAIL_PATTERN.test('')).toBe(false);
  });
});

describe('EMAIL_MENSAJE y EMAIL_MAX_LENGTH', () => {
  it('define un mensaje de error no vacío', () => {
    expect(EMAIL_MENSAJE.length).toBeGreaterThan(0);
  });

  it('define una longitud máxima positiva', () => {
    expect(EMAIL_MAX_LENGTH).toBeGreaterThan(0);
  });
});
