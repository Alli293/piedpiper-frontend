import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { EvolucionService } from './evolucion.service';

describe('EvolucionService', () => {
  let service: EvolucionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EvolucionService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EvolucionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta la evolucion con el anio como query param', () => {
    service.obtenerEvolucion(2026).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/emisiones/evolucion?anio=2026`);
    expect(req.request.method).toBe('GET');
    req.flush({ anio: 2026, serie: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, totalCarbonKg: 0 })) });
  });
});
