import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { EvolucionService } from './evolucion.service';

describe('EvolucionService', () => {
  let service: EvolucionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EvolucionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EvolucionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta la evolucion con el anio como query param', () => {
    service.obtenerEvolucion(2026).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones/evolucion?anio=2026`);
    expect(req.request.method).toBe('GET');
    req.flush({
      anio: 2026,
      serie: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, totalCarbonKg: 0 })),
    });
  });

  it('devuelve una serie de 12 puntos mensuales', async () => {
    const serie = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      totalCarbonKg: (i + 1) * 100,
    }));

    let result: any;
    service.obtenerEvolucion(2025).subscribe((resp) => {
      result = resp;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones/evolucion?anio=2025`);
    req.flush({ anio: 2025, serie });

    expect(result.anio).toBe(2025);
    expect(result.serie).toHaveLength(12);
    expect(result.serie[0].totalCarbonKg).toBe(100);
    expect(result.serie[11].totalCarbonKg).toBe(1200);
  });
});
