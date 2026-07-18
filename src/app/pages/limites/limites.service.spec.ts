import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthSessionService } from '../../core/auth-session.service';
import { environment } from '../../../environments/environment';
import { LimitesService } from './limites.service';

describe('LimitesService', () => {
  let service: LimitesService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/limites`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LimitesService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthSessionService,
          useValue: {
            getToken: () => 'jwt-token',
          },
        },
      ],
    });

    service = TestBed.inject(LimitesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('envia el cuerpo con anio y limiteMt', () => {
    service.guardarLimite({ anio: 2026, limiteMt: 50, justificacion: 'Meta anual' }).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(req.request.body).toEqual({
      anio: 2026,
      limiteMt: 50,
      justificacion: 'Meta anual',
    });
    req.flush({
      id: 1,
      empresaId: '11111111-1111-1111-1111-111111111111',
      anio: 2026,
      limiteMt: 50,
      justificacion: 'Meta anual',
      mensaje: '',
      actualizadoEn: null,
    });
  });

  it('lista y elimina limites de la empresa', () => {
    service.listarLimites().subscribe();
    service.eliminarLimite(2026).subscribe();

    const listReq = httpMock.expectOne(apiUrl);
    expect(listReq.request.method).toBe('GET');
    listReq.flush([]);

    const deleteReq = httpMock.expectOne(`${apiUrl}/2026`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);
  });
});
