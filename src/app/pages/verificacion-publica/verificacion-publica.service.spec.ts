import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { VerificacionCredencial } from './verificacion-publica.models';
import { VerificacionPublicaService } from './verificacion-publica.service';

describe('VerificacionPublicaService', () => {
  let service: VerificacionPublicaService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/verificar`;

  const resultado: VerificacionCredencial = {
    estado: 'valida_vigente',
    categoria: 'CERTIFICACION',
    tipo: 'CARBONO_NEUTRAL',
    nombreCertificacion: 'Carbono Neutral',
    nivelInsignia: null,
    empresa: 'EcoCorp',
    auditor: 'Ana Pérez',
    entidadCertificadora: 'CarbonHub',
    fechaEmision: '2026-01-15T00:00:00Z',
    fechaVencimiento: '2027-01-15',
    fechaRevocacion: null,
    fechaConsulta: '2026-08-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VerificacionPublicaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VerificacionPublicaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('hace GET a /api/verificar/{codigo}', () => {
    let respuesta: VerificacionCredencial | undefined;
    service.verificar('CH-2026-8F4A19KD').subscribe((valor) => (respuesta = valor));

    const req = httpMock.expectOne(`${baseUrl}/CH-2026-8F4A19KD`);
    expect(req.request.method).toBe('GET');
    req.flush(resultado);

    expect(respuesta).toEqual(resultado);
  });

  it('escapa el codigo en la URL', () => {
    service.verificar('codigo con espacio').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/codigo%20con%20espacio`);
    req.flush(resultado);
  });

  it('propaga un 404 al llamador en vez de silenciarlo', () => {
    let error: unknown;
    service.verificar('CH-2026-NOEXISTE').subscribe({
      error: (err) => (error = err),
    });

    httpMock
      .expectOne(`${baseUrl}/CH-2026-NOEXISTE`)
      .flush(
        { status: 404, message: 'Credencial no encontrada.', timestamp: '2026-08-01T00:00:00Z' },
        { status: 404, statusText: 'Not Found' }
      );

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(404);
  });
});
