import { CONTRASENA_HINT, CONTRASENA_MENSAJE, CONTRASENA_PATTERN } from './password.utils';

describe('CONTRASENA_PATTERN', () => {
  it('acepta una contraseña con mayúscula, minúscula, número y símbolo', () => {
    expect(CONTRASENA_PATTERN.test('Abcdef1.')).toBe(true);
  });

  it('rechaza una contraseña sin mayúscula', () => {
    expect(CONTRASENA_PATTERN.test('abcdef1.')).toBe(false);
  });

  it('rechaza una contraseña sin minúscula', () => {
    expect(CONTRASENA_PATTERN.test('ABCDEF1.')).toBe(false);
  });

  it('rechaza una contraseña sin número', () => {
    expect(CONTRASENA_PATTERN.test('Abcdefg.')).toBe(false);
  });

  it('rechaza una contraseña sin símbolo', () => {
    expect(CONTRASENA_PATTERN.test('Abcdefg1')).toBe(false);
  });

  it('rechaza una contraseña con menos de 8 caracteres', () => {
    expect(CONTRASENA_PATTERN.test('Ab1.')).toBe(false);
  });
});

describe('CONTRASENA_MENSAJE y CONTRASENA_HINT', () => {
  it('define un mensaje de error no vacío', () => {
    expect(CONTRASENA_MENSAJE.length).toBeGreaterThan(0);
  });

  it('define un texto de ayuda no vacío', () => {
    expect(CONTRASENA_HINT.length).toBeGreaterThan(0);
  });
});
