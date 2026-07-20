import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SesionInactividadService } from './sesion-inactividad.service';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';

describe('SesionInactividadService', () => {
  let service: SesionInactividadService;
  let authServiceStub: { cerrarSesion: ReturnType<typeof vi.fn> };
  let routerStub: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    authServiceStub = { cerrarSesion: vi.fn() };
    routerStub = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        SesionInactividadService,
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    });

    service = TestBed.inject(SesionInactividadService);
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
    expect(toastService.toasts().map((t) => t.title)).toContain(
      'Tu sesión expiró. Inicia sesión nuevamente.'
    );
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
});
