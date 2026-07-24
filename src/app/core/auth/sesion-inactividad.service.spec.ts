import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { SesionInactividadService, MENSAJE_SESION_EXPIRADA } from './sesion-inactividad.service';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';

describe('SesionInactividadService', () => {
  let service: SesionInactividadService;
  let authServiceStub: {
    cerrarSesion: ReturnType<typeof vi.fn>;
    token: ReturnType<typeof signal<string | null>>;
  };
  let routerStub: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    authServiceStub = { cerrarSesion: vi.fn(), token: signal<string | null>(null) };
    routerStub = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SesionInactividadService,
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    });

    service = TestBed.inject(SesionInactividadService);
    TestBed.tick();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('tras 30 minutos sin reiniciar, cierra la sesión, avisa y redirige a /login', () => {
    const toastService = TestBed.inject(ToastService);

    service.reiniciar();
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(authServiceStub.cerrarSesion).toHaveBeenCalled();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(toastService.toasts().map((t) => t.title)).toContain(MENSAJE_SESION_EXPIRADA);
  });

  it('reiniciar antes de los 30 minutos evita la expiración', () => {
    service.reiniciar();
    vi.advanceTimersByTime(29 * 60 * 1000);
    service.reiniciar();
    vi.advanceTimersByTime(29 * 60 * 1000);

    expect(authServiceStub.cerrarSesion).not.toHaveBeenCalled();
    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('detener cancela el temporizador pendiente', () => {
    service.reiniciar();
    service.detener();
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(authServiceStub.cerrarSesion).not.toHaveBeenCalled();
  });

  it('arranca el temporizador solo con que exista un token, sin esperar una petición autenticada (login o recarga con sesión activa)', () => {
    authServiceStub.token.set('jwt-existente');
    TestBed.tick();

    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(authServiceStub.cerrarSesion).toHaveBeenCalled();
  });

  it('detiene el temporizador automáticamente cuando el token se limpia (logout externo)', () => {
    authServiceStub.token.set('jwt-existente');
    TestBed.tick();

    authServiceStub.token.set(null);
    TestBed.tick();
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(authServiceStub.cerrarSesion).not.toHaveBeenCalled();
  });

  it('cerrarSesionPorExpiracion detiene el temporizador pendiente, cierra sesión, avisa y redirige', () => {
    const toastService = TestBed.inject(ToastService);
    service.reiniciar();

    service.cerrarSesionPorExpiracion();

    expect(authServiceStub.cerrarSesion).toHaveBeenCalled();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(toastService.toasts().map((t) => t.title)).toContain(MENSAJE_SESION_EXPIRADA);

    routerStub.navigateByUrl.mockClear();
    vi.advanceTimersByTime(30 * 60 * 1000);
    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });
});
