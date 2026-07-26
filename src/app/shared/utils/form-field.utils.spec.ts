import { fieldError, TouchedErrorField } from './form-field.utils';

function campo(touched: boolean, mensajes: (string | undefined)[]): TouchedErrorField {
  return {
    touched: () => touched,
    errors: () => mensajes.map((message) => ({ message })),
  };
}

describe('fieldError', () => {
  it('retorna cadena vacía cuando el campo no ha sido tocado', () => {
    expect(fieldError(campo(false, ['Requerido']))).toBe('');
  });

  it('retorna el mensaje del primer error cuando el campo fue tocado', () => {
    expect(fieldError(campo(true, ['Requerido', 'Otro error']))).toBe('Requerido');
  });

  it('retorna cadena vacía cuando el campo fue tocado pero no tiene errores', () => {
    expect(fieldError(campo(true, []))).toBe('');
  });

  it('retorna cadena vacía cuando el primer error no tiene mensaje', () => {
    expect(fieldError(campo(true, [undefined]))).toBe('');
  });
});
