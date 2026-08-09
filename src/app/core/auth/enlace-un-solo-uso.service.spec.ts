import { TestBed } from '@angular/core/testing';
import { EnlaceUnSoloUsoService } from './enlace-un-solo-uso.service';

describe('EnlaceUnSoloUsoService', () => {
  let service: EnlaceUnSoloUsoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnlaceUnSoloUsoService);
    window.history.replaceState({}, '', '/');
  });

  it('lee el token del fragmento y lo retira de la barra de direcciones', () => {
    window.history.replaceState({}, '', '/reset-contrasena#token=abc_123');

    expect(service.consumir()).toBe('abc_123');
    expect(window.location.pathname).toBe('/reset-contrasena');
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('');
  });

  it('mantiene compatibilidad con enlaces anteriores en query y elimina solo el secreto', () => {
    window.history.replaceState({}, '', '/verificar-correo?idioma=es&token=legacy-token');

    expect(service.consumir()).toBe('legacy-token');
    expect(window.location.search).toBe('?idioma=es');
  });

  it('usa el token recibido por binding cuando la URL ya no contiene el secreto', () => {
    window.history.replaceState({}, '', '/registro/invitacion');

    expect(service.consumir('token-binding')).toBe('token-binding');
    expect(window.location.pathname).toBe('/registro/invitacion');
  });
});
