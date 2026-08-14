import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ngrokInterceptor } from './ngrok.interceptor';
import { environment } from '../../../environments/environment';

describe('ngrokInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([ngrokInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('agrega el header para saltar la advertencia de ngrok en peticiones al backend', () => {
    httpClient.get(`${environment.apiBaseUrl}/catalogos/zonas`).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/catalogos/zonas`);
    expect(req.request.headers.get('ngrok-skip-browser-warning')).toBe('true');
    req.flush([]);
  });

  it('no toca peticiones a terceros para no disparar preflight CORS', () => {
    httpClient.get('https://generativelanguage.googleapis.com/v1beta/models').subscribe();

    const req = httpMock.expectOne('https://generativelanguage.googleapis.com/v1beta/models');
    expect(req.request.headers.has('ngrok-skip-browser-warning')).toBe(false);
    req.flush({});
  });
});
