import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { ImaService, ImaResponse } from './ima.service';

describe('ImaService', () => {
  let service: ImaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ImaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Validates: Requirements 6.1
  it('consulta el IMA con anio y mes como query params', () => {
    service.obtenerIma(2024, 6).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima?anio=2024&mes=6`);
    expect(req.request.method).toBe('GET');
    req.flush(buildImaResponse());
  });

  // Validates: Requirements 6.1
  it('envía los parámetros correctos para diferentes valores de período', () => {
    service.obtenerIma(2025, 12).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima?anio=2025&mes=12`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('anio')).toBe('2025');
    expect(req.request.params.get('mes')).toBe('12');
    req.flush(buildImaResponse());
  });

  // Validates: Requirements 6.2
  it('retorna la respuesta tipada con interpretacion y siguientePaso', () => {
    let result: ImaResponse | undefined;
    service.obtenerIma(2024, 6).subscribe((resp) => {
      result = resp;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima?anio=2024&mes=6`);
    req.flush(
      buildImaResponse({
        interpretacion: 'Tu empresa tiene buen desempeño.',
        siguientePaso: 'Mejorar la cobertura de registros.',
      })
    );

    expect(result).toBeDefined();
    expect(result!.interpretacion).toBe('Tu empresa tiene buen desempeño.');
    expect(result!.siguientePaso).toBe('Mejorar la cobertura de registros.');
  });

  it('maneja respuesta parcial cuando el sector no tiene suficientes empresas', () => {
    let result: ImaResponse | undefined;
    service.obtenerIma(2026, 1).subscribe((resp) => {
      result = resp;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima?anio=2026&mes=1`);
    req.flush(
      buildImaResponse({
        cobertura: 50,
        puntajeIntensidadSectorial: null,
        consistencia: 25,
        ima: 37.5,
        parcial: true,
        motivoParcial: 'Tu sector no tiene suficientes empresas.',
        intensidad: null,
      })
    );

    expect(result!.parcial).toBe(true);
    expect(result!.puntajeIntensidadSectorial).toBeNull();
    expect(result!.motivoParcial).toBe('Tu sector no tiene suficientes empresas.');
  });

  it('retorna interpretacion y siguientePaso como null cuando no hay datos de IA', () => {
    let result: ImaResponse | undefined;
    service.obtenerIma(2024, 6).subscribe((resp) => {
      result = resp;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima?anio=2024&mes=6`);
    req.flush(buildImaResponse({ interpretacion: null, siguientePaso: null }));

    expect(result!.interpretacion).toBeNull();
    expect(result!.siguientePaso).toBeNull();
  });

  function buildImaResponse(overrides: Partial<ImaResponse> = {}): ImaResponse {
    return {
      cobertura: 75,
      puntajeIntensidadSectorial: 58,
      consistencia: 80,
      ima: 71,
      parcial: false,
      motivoParcial: null,
      intensidad: 1.5,
      calculatedAt: '2024-06-18T00:00:00Z',
      interpretacion: null,
      siguientePaso: null,
      ...overrides,
    };
  }
});
