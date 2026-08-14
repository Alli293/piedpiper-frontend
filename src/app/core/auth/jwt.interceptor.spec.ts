import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from './auth.service';
import { SesionInactividadService } from './sesion-inactividad.service';
import { environment } from '../../../environments/environment';

describe('jwtInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceStub: { token: () => string | null };
  let sesionInactividadStub: { reiniciar: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceStub = { token: () => null };
    sesionInactividadStub = { reiniciar: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceStub },
        { provide: SesionInactividadService, useValue: sesionInactividadStub },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('agrega el header Authorization cuando hay token y la URL pertenece a la API', () => {
    authServiceStub.token = () => 'jwt-123';

    httpClient.get(`${environment.apiBaseUrl}/emisiones`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-123');
    req.flush({});
  });

  it('agrega el header Authorization al path exacto de la API', () => {
    authServiceStub.token = () => 'jwt-123';

    httpClient.get(environment.apiBaseUrl).subscribe();

    const req = httpMock.expectOne(environment.apiBaseUrl);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-123');
    req.flush({});
  });

  it('reinicia el temporizador de inactividad cuando adjunta el token', () => {
    authServiceStub.token = () => 'jwt-123';

    httpClient.get(`${environment.apiBaseUrl}/emisiones`).subscribe();

    expect(sesionInactividadStub.reiniciar).toHaveBeenCalled();
    httpMock.expectOne(`${environment.apiBaseUrl}/emisiones`).flush({});
  });

  it('no agrega el header Authorization cuando no hay token', () => {
    authServiceStub.token = () => null;

    httpClient.get(`${environment.apiBaseUrl}/emisiones`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(sesionInactividadStub.reiniciar).not.toHaveBeenCalled();
    req.flush({});
  });

  it('no agrega el header Authorization cuando la URL no pertenece a la API', () => {
    authServiceStub.token = () => 'jwt-123';

    httpClient.get('https://external.example.com/resource').subscribe();

    const req = httpMock.expectOne('https://external.example.com/resource');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('no confia en una ruta que solo comparte el prefijo textual de la API', () => {
    authServiceStub.token = () => 'jwt-123';

    httpClient.get('/api-maliciosa/recopilar').subscribe();

    const req = httpMock.expectOne('/api-maliciosa/recopilar');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(sesionInactividadStub.reiniciar).not.toHaveBeenCalled();
    req.flush({});
  });
});
