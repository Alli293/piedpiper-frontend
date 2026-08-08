import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EcoRutaAlternativasService } from './ecoruta-alternativas.service';
import { ComparacionResponse, SustitucionRequest } from './models/alternativas.model';
import { Itinerario } from './models/itinerario.model';

describe('EcoRutaAlternativasService', () => {
  let service: EcoRutaAlternativasService;
  let httpMock: HttpTestingController;

  const itinerarioId = '11111111-1111-1111-1111-111111111111';
  const actividadId = '22222222-2222-2222-2222-222222222222';

  const mockComparacionResponse: ComparacionResponse = {
    actividadOriginalNombre: 'Caminata por el bosque',
    ecoScoreOriginal: 60,
    categoriaTuristica: 'NATURALEZA',
    provincia: 'Heredia',
    alternativas: [
      {
        nombre: 'Senderismo en reserva biológica',
        descripcion: 'Recorrido guiado por senderos naturales',
        ecoScore: 85,
        costoAproximado: 15000,
        moneda: 'CRC',
        establecimientoRecomendado: 'Reserva Biológica Tirimbina',
        diferenciaAmbiental: 25,
        mejorDesempeno: true,
      },
      {
        nombre: 'Observación de aves',
        descripcion: 'Tour de avistamiento con guía local',
        ecoScore: 78,
        costoAproximado: 12000,
        moneda: 'CRC',
        establecimientoRecomendado: 'Finca Los Colibríes',
        diferenciaAmbiental: 18,
        mejorDesempeno: false,
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
    fechaGeneracion: '2026-07-30T20:38:19.896Z',
    generadoParcial: false,
    mensajeParcial: null,
    dias: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EcoRutaAlternativasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('obtenerAlternativas', () => {
    it('hace GET a /ecoruta/itinerarios/{id}/actividades/{actividadId}/alternativas', () => {
      let resultado: ComparacionResponse | undefined;
      service
        .obtenerAlternativas(itinerarioId, actividadId)
        .subscribe((response) => (resultado = response));

      const req = httpMock.expectOne(
        `${EcoRutaAlternativasService.URL}/${itinerarioId}/actividades/${actividadId}/alternativas`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockComparacionResponse);

      expect(resultado).toEqual(mockComparacionResponse);
    });

    it('pasa los parámetros correctos en la URL', () => {
      const otroItinerarioId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const otraActividadId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

      service.obtenerAlternativas(otroItinerarioId, otraActividadId).subscribe();

      const req = httpMock.expectOne(
        `${EcoRutaAlternativasService.URL}/${otroItinerarioId}/actividades/${otraActividadId}/alternativas`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockComparacionResponse);
    });
  });

  describe('sustituirActividad', () => {
    const sustitucionBody: SustitucionRequest = {
      nombre: 'Senderismo en reserva biológica',
      descripcion: 'Recorrido guiado por senderos naturales',
      costoAproximado: 15000,
      moneda: 'CRC',
      establecimientoRecomendado: 'Reserva Biológica Tirimbina',
      ecoScore: 85,
      categoriaTuristica: 'NATURALEZA',
      provincia: 'HEREDIA',
    };

    it('hace PUT a /ecoruta/itinerarios/{id}/actividades/{actividadId}/sustituir con body correcto', () => {
      let resultado: Itinerario | undefined;
      service
        .sustituirActividad(itinerarioId, actividadId, sustitucionBody)
        .subscribe((response) => (resultado = response));

      const req = httpMock.expectOne(
        `${EcoRutaAlternativasService.URL}/${itinerarioId}/actividades/${actividadId}/sustituir`
      );
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(sustitucionBody);
      req.flush(mockItinerario);

      expect(resultado).toEqual(mockItinerario);
    });

    it('envía todos los campos del SustitucionRequest en el body', () => {
      const bodyCompleto: SustitucionRequest = {
        nombre: 'Observación de aves',
        descripcion: null,
        costoAproximado: null,
        moneda: null,
        establecimientoRecomendado: null,
        ecoScore: 78,
        categoriaTuristica: 'AVENTURA',
        provincia: 'SAN_JOSE',
      };

      service.sustituirActividad(itinerarioId, actividadId, bodyCompleto).subscribe();

      const req = httpMock.expectOne(
        `${EcoRutaAlternativasService.URL}/${itinerarioId}/actividades/${actividadId}/sustituir`
      );
      expect(req.request.body).toEqual(bodyCompleto);
      expect(req.request.body.nombre).toBe('Observación de aves');
      expect(req.request.body.ecoScore).toBe(78);
      expect(req.request.body.descripcion).toBeNull();
      req.flush(mockItinerario);
    });
  });
});
