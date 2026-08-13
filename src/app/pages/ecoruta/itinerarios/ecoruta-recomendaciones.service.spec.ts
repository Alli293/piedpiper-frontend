import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EcoRutaRecomendacionesService } from './ecoruta-recomendaciones.service';
import { SustitucionRequest } from './models/alternativas.model';
import { Itinerario } from './models/itinerario.model';
import { RecomendacionesResponse } from './models/recomendaciones.model';

describe('EcoRutaRecomendacionesService', () => {
  let service: EcoRutaRecomendacionesService;
  let httpMock: HttpTestingController;

  const itinerarioId = '11111111-1111-1111-1111-111111111111';
  const actividadId = '22222222-2222-2222-2222-222222222222';

  const mockRecomendacionesResponse: RecomendacionesResponse = {
    recomendaciones: [
      {
        tipo: 'ACTIVIDAD_ALTERNATIVA',
        actividadId,
        actividadNombre: 'Canopy en Monteverde',
        descripcion: 'Sustituye "Canopy en Monteverde" por "Senderismo en Reserva Biológica".',
        incrementoEstimado: 5.5,
        alternativa: {
          nombre: 'Senderismo en Reserva Biológica',
          descripcion: 'Caminata guiada por bosque primario',
          ecoScore: 85,
          costoAproximado: 15000,
          moneda: 'CRC',
          establecimientoRecomendado: 'Reserva Monteverde',
          diferenciaAmbiental: 20,
          mejorDesempeno: true,
        },
        categoriaTuristica: 'AVENTURA',
        provincia: 'PUNTARENAS',
      },
    ],
    mensaje: null,
  };

  const mockItinerario: Itinerario = {
    id: itinerarioId,
    cantidadDias: 2,
    fechaInicio: '2026-09-01',
    tipoViaje: 'INDIVIDUAL',
    estado: 'GENERADO',
    version: 2,
    puntuacionAmbientalPreliminar: 90,
    ecoScore: 85,
    clasificacionAmbiental: 'EXCELENTE',
    ecoScoreParcial: false,
    ecoScoreCalculadoEn: '2026-07-30T20:38:19.896Z',
    fechaGeneracion: '2026-07-30T20:38:19.896Z',
    generadoParcial: false,
    mensajeParcial: null,
    dias: [],
    establecimientosEvaluados: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EcoRutaRecomendacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('obtenerRecomendaciones', () => {
    it('hace GET a /ecoruta/itinerarios/{id}/recomendaciones', () => {
      let resultado: RecomendacionesResponse | undefined;
      service.obtenerRecomendaciones(itinerarioId).subscribe((response) => (resultado = response));

      const req = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${itinerarioId}/recomendaciones`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRecomendacionesResponse);

      expect(resultado).toEqual(mockRecomendacionesResponse);
    });

    it('retorna la lista vacía y el mensaje cuando el itinerario ya está optimizado', () => {
      const respuestaOptimizada: RecomendacionesResponse = {
        recomendaciones: [],
        mensaje: 'Tu itinerario ya presenta un excelente desempeño ambiental.',
      };

      let resultado: RecomendacionesResponse | undefined;
      service.obtenerRecomendaciones(itinerarioId).subscribe((response) => (resultado = response));

      const req = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${itinerarioId}/recomendaciones`
      );
      req.flush(respuestaOptimizada);

      expect(resultado?.recomendaciones).toEqual([]);
      expect(resultado?.mensaje).toBe('Tu itinerario ya presenta un excelente desempeño ambiental.');
    });
  });

  describe('aplicarRecomendacion', () => {
    const sustitucionBody: SustitucionRequest = {
      nombre: 'Senderismo en Reserva Biológica',
      descripcion: 'Caminata guiada por bosque primario',
      costoAproximado: 15000,
      moneda: 'CRC',
      establecimientoRecomendado: 'Reserva Monteverde',
      ecoScore: 85,
      categoriaTuristica: 'AVENTURA',
      provincia: 'PUNTARENAS',
    };

    it('hace PUT a /ecoruta/itinerarios/{id}/recomendaciones/{actividadId}/aplicar con body correcto', () => {
      let resultado: Itinerario | undefined;
      service
        .aplicarRecomendacion(itinerarioId, actividadId, sustitucionBody)
        .subscribe((response) => (resultado = response));

      const req = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${itinerarioId}/recomendaciones/${actividadId}/aplicar`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(sustitucionBody);
      req.flush(mockItinerario);

      expect(resultado).toEqual(mockItinerario);
    });
  });
});
