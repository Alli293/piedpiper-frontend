import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta la comparacion con el anio como query param', () => {
    service.obtenerComparacion(2026).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones/comparacion?anio=2026`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('anio')).toBe('2026');

    req.flush({
      anio: 2026,
      huellaAcumuladaT: 30,
      limiteT: 50,
      porcentajeConsumido: 60,
      estado: 'dentro',
      mensaje: null,
    });
  });

  it("exporta el reporte PDF con responseType 'blob'", () => {
    service.exportarReportePdf(2026, 7).subscribe((blob) => {
      expect(blob.type).toBe('application/pdf');
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones/reporte/pdf?anio=2026&mes=7`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    expect(req.request.params.get('anio')).toBe('2026');
    expect(req.request.params.get('mes')).toBe('7');

    req.flush(new Blob(['pdf'], { type: 'application/pdf' }));
  });
});
