import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { ImaService, ImaResponse, ImaTendenciaResponse } from './ima.service';

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

  it('consulta la tendencia con la ventana como query param', () => {
    service.obtenerTendencia(12).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima/tendencia?mesesAtras=12`);
    expect(req.request.method).toBe('GET');
    req.flush({ mesesAtras: 12, serie: [], sinDatosSectoriales: false, eventos: [] });
  });

  it('envia la ventana solicitada cuando no es la de por defecto', () => {
    service.obtenerTendencia(6).subscribe();
    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima/tendencia?mesesAtras=6`);
    expect(req.request.params.get('mesesAtras')).toBe('6');
    req.flush({ mesesAtras: 6, serie: [], sinDatosSectoriales: false, eventos: [] });
  });

  it('conserva los puntos nulos de la serie sin convertirlos en ceros', () => {
    let result: ImaTendenciaResponse | undefined;
    service.obtenerTendencia(3).subscribe((resp) => {
      result = resp;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima/tendencia?mesesAtras=3`);
    req.flush({
      mesesAtras: 3,
      serie: [
        { mes: '2026-04', imaEmpresa: null, imaPromedioSector: null },
        { mes: '2026-05', imaEmpresa: 68, imaPromedioSector: 63.5 },
        { mes: '2026-06', imaEmpresa: 71, imaPromedioSector: null },
      ],
      sinDatosSectoriales: false,
      eventos: [],
    });

    expect(result?.serie[0].imaEmpresa).toBeNull();
    expect(result?.serie[1].imaPromedioSector).toBe(63.5);
    expect(result?.serie[2].imaPromedioSector).toBeNull();
  });

  it('lee el arreglo de eventos anotados de la respuesta', () => {
    let result: ImaTendenciaResponse | undefined;
    service.obtenerTendencia(12).subscribe((resp) => {
      result = resp;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima/tendencia?mesesAtras=12`);
    req.flush({
      mesesAtras: 12,
      serie: [{ mes: '2026-06', imaEmpresa: 71, imaPromedioSector: 64 }],
      sinDatosSectoriales: false,
      eventos: [
        {
          mes: '2026-06',
          tipo: 'CRUCE_SECTOR',
          texto: 'En junio 2026 tu IMA superó el promedio de tu sector.',
        },
      ],
    });

    expect(result?.eventos).toHaveLength(1);
    expect(result?.eventos[0].tipo).toBe('CRUCE_SECTOR');
    expect(result?.eventos[0].mes).toBe('2026-06');
  });

  it('consulta el benchmark sectorial con anio y mes como query params', () => {
    service.obtenerBenchmark(2026, 7).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/ima/benchmark?anio=2026&mes=7`);
    expect(req.request.method).toBe('GET');
    req.flush({
      benchmarkDisponible: true,
      cantidadEmpresas: 8,
      imaParcial: false,
      ima: { valorEmpresa: 71, promedioSector: 64, posicion: 'POR_ENCIMA' },
      cobertura: { valorEmpresa: 75, promedioSector: 70, posicion: 'POR_ENCIMA' },
      puntajeIntensidadSectorial: {
        valorEmpresa: 58,
        promedioSector: 66,
        posicion: 'POR_DEBAJO',
      },
      consistencia: { valorEmpresa: 80, promedioSector: 62, posicion: 'POR_ENCIMA' },
    });
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
      calculatedAt: '2026-07-18T00:00:00Z',
      interpretacion: null,
      siguientePaso: null,
      ...overrides,
    };
  }
});
