import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { InsigniasEcoRutaService } from './insignias-ecoruta.service';

describe('InsigniasEcoRutaService', () => {
  let service: InsigniasEcoRutaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InsigniasEcoRutaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista las insignias obtenidas desde el endpoint de EcoRuta', () => {
    const respuesta = [
      {
        idInsignia: 2,
        nombre: 'EcoScore Excelente',
        descripcion: 'Completaste tu primer itinerario sostenible.',
        eventoDesbloqueo: 'primer_itinerario_sostenible',
        fechaObtencion: '2026-07-15T20:32:00Z',
      },
    ];

    service.listarObtenidas().subscribe((insignias) => {
      expect(insignias).toEqual(respuesta);
    });

    const req = httpMock.expectOne(InsigniasEcoRutaService.URL);
    expect(req.request.method).toBe('GET');
    req.flush(respuesta);
  });
});
