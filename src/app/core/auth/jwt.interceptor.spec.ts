import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('jwtInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceStub: { token: () => string | null };

  beforeEach(() => {
    authServiceStub = { token: () => null };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceStub },
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

  it('no agrega el header Authorization cuando no hay token', () => {
    authServiceStub.token = () => null;

    httpClient.get(`${environment.apiBaseUrl}/emisiones`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('no agrega el header Authorization cuando la URL no pertenece a la API', () => {
    authServiceStub.token = () => 'jwt-123';

    httpClient.get('https://external.example.com/resource').subscribe();

    const req = httpMock.expectOne('https://external.example.com/resource');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
