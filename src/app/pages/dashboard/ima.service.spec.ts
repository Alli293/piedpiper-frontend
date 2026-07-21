import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { ImaService } from './ima.service';

describe('ImaService', () => {
  let service: ImaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ImaService, provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ImaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('consulta el IMA con anio y mes como query params', () => {
    service.obtenerIma(2026, 7).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima?anio=2026&mes=7`);
    expect(req.request.method).toBe('GET');
    req.flush({ cobertura: 75, puntajeIntensidadSectorial: 58, consistencia: 80, ima: 71, parcial: false, motivoParcial: null, intensidad: 1.5, calculatedAt: '2026-07-18T00:00:00Z', interpretacionIa: null });
  });

  it('consulta el benchmark sectorial con anio y mes como query params', () => {
    service.obtenerBenchmark(2026, 7).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima/benchmark?anio=2026&mes=7`);
    expect(req.request.method).toBe('GET');
    req.flush({ benchmarkDisponible: true, cantidadEmpresas: 8, imaParcial: false, ima: { valorEmpresa: 71, promedioSector: 64, posicion: 'POR_ENCIMA' }, cobertura: { valorEmpresa: 75, promedioSector: 70, posicion: 'POR_ENCIMA' }, puntajeIntensidadSectorial: { valorEmpresa: 58, promedioSector: 66, posicion: 'POR_DEBAJO' }, consistencia: { valorEmpresa: 80, promedioSector: 62, posicion: 'POR_ENCIMA' } });
  });
});
