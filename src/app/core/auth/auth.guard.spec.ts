import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, rolGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let authService: { token: ReturnType<typeof signal<string | null>> };
  let router: Router;

  beforeEach(() => {
    authService = { token: signal<string | null>(null) };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  function ejecutarGuard() {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }

  it('permite el acceso cuando hay token', () => {
    authService.token.set('jwt-123');

    expect(ejecutarGuard()).toBe(true);
  });

  it('redirige a /login cuando no hay token', () => {
    const resultado = ejecutarGuard();

    expect(resultado).toEqual(router.parseUrl('/login'));
  });
});

describe('rolGuard', () => {
  let authService: {
    token: ReturnType<typeof signal<string | null>>;
    rol: ReturnType<typeof signal<string | null>>;
  };
  let router: Router;

  beforeEach(() => {
    authService = { token: signal<string | null>(null), rol: signal<string | null>(null) };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
  });

  function ejecutarGuard() {
    return TestBed.runInInjectionContext(() =>
      rolGuard('ADMINISTRADOR_PLATAFORMA')({} as any, {} as any)
    );
  }

  it('permite el acceso cuando el rol coincide', () => {
    authService.token.set('jwt-123');
    authService.rol.set('ADMINISTRADOR_PLATAFORMA');

    expect(ejecutarGuard()).toBe(true);
  });

  it('redirige a la pantalla de inicio del propio rol cuando el rol no coincide', () => {
    authService.token.set('jwt-123');
    authService.rol.set('ADMINISTRADOR_EMPRESA');

    expect(ejecutarGuard()).toEqual(router.parseUrl('empresa/panel'));
  });

  it('redirige a /login cuando no hay token', () => {
    expect(ejecutarGuard()).toEqual(router.parseUrl('/login'));
  });

  it('redirige a /login cuando el rol del token no es reconocido', () => {
    authService.token.set('jwt-123');
    authService.rol.set('ROL_INEXISTENTE');

    expect(ejecutarGuard()).toEqual(router.parseUrl('/login'));
  });

  it('permite el acceso cuando el rol coincide con alguno de varios roles permitidos', () => {
    authService.token.set('jwt-123');
    authService.rol.set('USUARIO_GENERAL');

    const resultado = TestBed.runInInjectionContext(() =>
      rolGuard('ADMINISTRADOR_EMPRESA', 'USUARIO_GENERAL')({} as any, {} as any)
    );

    expect(resultado).toBe(true);
  });
});
