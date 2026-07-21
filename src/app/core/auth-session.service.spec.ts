import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  let token = signal<string | null>(null);
  let service: AuthSessionService;

  beforeEach(() => {
    token = signal<string | null>(null);

    TestBed.configureTestingModule({
      providers: [
        AuthSessionService,
        {
          provide: AuthService,
          useValue: { token },
        },
      ],
    });

    service = TestBed.inject(AuthSessionService);
  });

  it('obtiene iniciales desde nombre y apellidos del token', () => {
    token.set(jwt({ nombre: 'Ariela', apellidos: 'Jimenez' }));

    expect(service.getUserInitials()).toBe('AJ');
  });

  it('usa fallback si no hay datos de usuario', () => {
    token.set(jwt({ rol: 'administrador_empresa' }));

    expect(service.getUserInitials()).toBe('US');
  });
});

function jwt(payload: object): string {
  return `header.${toBase64Url(JSON.stringify(payload))}.signature`;
}

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
