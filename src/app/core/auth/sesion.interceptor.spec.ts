import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { sesionInterceptor } from './sesion.interceptor';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

describe('sesionInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceStub: {
    token: () => string | null;
    renovarToken: ReturnType<typeof vi.fn>;
    cerrarSesion: ReturnType<typeof vi.fn>;
  };
  let routerStub: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceStub = {
      token: () => 'jwt-actual',
      renovarToken: vi.fn(),
      cerrarSesion: vi.fn(),
    };
    routerStub = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sesionInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renueva el token cuando la respuesta trae X-Refresh-Token', () => {
    httpClient.get(`${environment.apiBaseUrl}/emisiones`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones`);
    req.flush(
      {},
      { headers: { 'X-Refresh-Token': 'jwt-renovado' }, status: 200, statusText: 'OK' }
    );

    expect(authServiceStub.renovarToken).toHaveBeenCalledWith('jwt-renovado');
  });

  it('no renueva el token cuando la respuesta no trae el header', () => {
    httpClient.get(`${environment.apiBaseUrl}/emisiones`).subscribe();

    httpMock.expectOne(`${environment.apiBaseUrl}/emisiones`).flush({});

    expect(authServiceStub.renovarToken).not.toHaveBeenCalled();
  });

  it('ante un 401 con token adjunto, cierra la sesión, avisa y redirige a /login', () => {
    httpClient.get(`${environment.apiBaseUrl}/emisiones`).subscribe({ error: () => undefined });

    const toastService = TestBed.inject(ToastService);
    httpMock
      .expectOne(`${environment.apiBaseUrl}/emisiones`)
      .flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceStub.cerrarSesion).toHaveBeenCalled();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(toastService.toasts().map((t) => t.title)).toContain(
      'Tu sesión expiró. Inicia sesión nuevamente.'
    );
  });

  it('ante un 401 sin token adjunto (login), no cierra sesión ni redirige', () => {
    authServiceStub.token = () => null;

    httpClient.post(`${environment.apiBaseUrl}/auth/login`, {}).subscribe({
      error: () => undefined,
    });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceStub.cerrarSesion).not.toHaveBeenCalled();
    expect(routerStub.navigateByUrl).not.toHaveBeenCalled();
  });

  it('no intercepta llamadas fuera de la API', () => {
    httpClient.get('https://external.example.com/resource').subscribe();

    httpMock.expectOne('https://external.example.com/resource').flush({});

    expect(authServiceStub.renovarToken).not.toHaveBeenCalled();
  });
});
