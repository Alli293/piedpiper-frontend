import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { sesionInterceptor } from './sesion.interceptor';
import { AuthService } from './auth.service';
import { SesionInactividadService } from './sesion-inactividad.service';
import { environment } from '../../../environments/environment';

describe('sesionInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceStub: {
    token: () => string | null;
    renovarToken: ReturnType<typeof vi.fn>;
  };
  let sesionInactividadStub: { cerrarSesionPorExpiracion: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceStub = {
      token: () => 'jwt-actual',
      renovarToken: vi.fn(),
    };
    sesionInactividadStub = { cerrarSesionPorExpiracion: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sesionInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceStub },
        { provide: SesionInactividadService, useValue: sesionInactividadStub },
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

  it('ante un 401 con token adjunto, delega el cierre de sesión por expiración', () => {
    httpClient.get(`${environment.apiBaseUrl}/emisiones`).subscribe({ error: () => undefined });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/emisiones`)
      .flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(sesionInactividadStub.cerrarSesionPorExpiracion).toHaveBeenCalled();
  });

  it('ante un 401 sin token adjunto (login), no cierra sesión', () => {
    authServiceStub.token = () => null;

    httpClient.post(`${environment.apiBaseUrl}/auth/login`, {}).subscribe({
      error: () => undefined,
    });

    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(sesionInactividadStub.cerrarSesionPorExpiracion).not.toHaveBeenCalled();
  });

  it('no intercepta llamadas fuera de la API', () => {
    httpClient.get('https://external.example.com/resource').subscribe();

    httpMock.expectOne('https://external.example.com/resource').flush({});

    expect(authServiceStub.renovarToken).not.toHaveBeenCalled();
  });
});
