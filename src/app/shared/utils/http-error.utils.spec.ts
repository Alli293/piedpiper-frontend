import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage, apiErrorMessageAsync } from './http-error.utils';

describe('http-error.utils', () => {
  it('extrae el mensaje de un error JSON ya parseado', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Solicitud invÃ¡lida.' },
    });

    expect(apiErrorMessage(error)).toBe('Solicitud invÃ¡lida.');
  });

  it('extrae el mensaje de un error JSON recibido como blob', async () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: new Blob([JSON.stringify({ message: 'AÃ±o invÃ¡lido.' })], {
        type: 'application/json',
      }),
    });

    await expect(apiErrorMessageAsync(error)).resolves.toBe('AÃ±o invÃ¡lido.');
  });

  it('retorna undefined si el blob no contiene JSON valido', async () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: new Blob(['respuesta no json'], { type: 'text/plain' }),
    });

    await expect(apiErrorMessageAsync(error)).resolves.toBeUndefined();
  });
});
