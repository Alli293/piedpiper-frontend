import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
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
