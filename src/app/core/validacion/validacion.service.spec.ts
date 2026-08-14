import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ValidacionService } from './validacion.service';
import { environment } from '../../../environments/environment';

describe('ValidacionService', () => {
  let service: ValidacionService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/admin/solicitudes-auditor`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ValidacionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ValidacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listarPendientes hace GET con la pagina', () => {
    service.listarPendientes(2).subscribe((r) => expect(r.totalElementos).toBe(0));

    const req = httpMock.expectOne(`${base}?pagina=2`);
    expect(req.request.method).toBe('GET');
    req.flush({ contenido: [], pagina: 2, totalPaginas: 3, totalElementos: 0 });
  });

  it('resolver hace POST con la decision y el motivo', () => {
    service.resolver('sol-1', 'rechazado', 'Motivo de rechazo valido').subscribe();

    const req = httpMock.expectOne(`${base}/sol-1/decision`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      decision: 'rechazado',
      motivoRechazo: 'Motivo de rechazo valido',
    });
    req.flush({
      id: 'sol-1',
      estado: 'RECHAZADO',
      estadoAuditor: 'RECHAZADO',
      fechaResolucion: '2026-07-15T00:00:00Z',
      motivoRechazo: 'Motivo de rechazo valido',
    });
  });

  it('resolver aprobado envia motivo nulo', () => {
    service.resolver('sol-1', 'aprobado').subscribe();

    const req = httpMock.expectOne(`${base}/sol-1/decision`);
    expect(req.request.body).toEqual({ decision: 'aprobado', motivoRechazo: null });
    req.flush({
      id: 'sol-1',
      estado: 'APROBADO',
      estadoAuditor: 'ACTIVO',
      fechaResolucion: '2026-07-15T00:00:00Z',
      motivoRechazo: null,
    });
  });
});
