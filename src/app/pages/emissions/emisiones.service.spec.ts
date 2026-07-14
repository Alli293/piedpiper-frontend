import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmisionesService } from './emisiones.service';
import { environment } from '../../../environments/environment';

describe('EmisionesService', () => {
  let service: EmisionesService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/emisiones`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmisionesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmisionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('registrarEnvio hace POST a /emisiones/envio con el body correcto', () => {
    const payload = {
      titulo: 'Envío test',
      weightValue: 200,
      weightUnit: 'KG' as const,
      distanceValue: 500,
      distanceUnit: 'KM' as const,
      transportMethod: 'TRUCK' as const,
      fechaActividad: '2026-07-01',
    };

    service.registrarEnvio(payload).subscribe();

    const req = httpMock.expectOne(`${base}/envio`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: '123', carbonKg: 35.5, carbonMt: 0.036 });
  });

  it('registrarElectricidad hace POST a /emisiones/electricidad', () => {
    const payload = {
      titulo: 'Consumo test',
      electricityValue: 1000,
      electricityUnit: 'kwh' as const,
      fechaActividad: '2026-07-01',
    };

    service.registrarElectricidad(payload).subscribe();

    const req = httpMock.expectOne(`${base}/electricidad`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: '456', carbonKg: 0.5 });
  });

  it('posts the expected body to /api/emisiones/vuelo', () => {
    const payload = {
      passengers: 2,
      distanceUnit: 'km' as const,
      fechaActividad: '2026-07-09',
      legs: [
        { departureAirport: 'SFO', destinationAirport: 'YYZ', cabinClass: 'economy' as const },
      ],
    };

    service.registrarVuelo(payload).subscribe();

    const req = httpMock.expectOne('/api/emisiones/vuelo');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({
      id: '2',
      categoria: 'VUELO',
      titulo: 'Viaje aéreo SFO-YYZ',
      fechaActividad: payload.fechaActividad,
      passengers: 2,
      legs: payload.legs,
      distanceUnit: 'km',
      distanceValue: 7200,
      carbonKg: 347,
      carbonMt: 0.347,
      factorEmisionId: 'climatiq-travel-v1-distance',
      estimatedAt: '2026-07-09T00:00:00Z',
      createdAt: '2026-07-09T00:00:00Z',
    });
  });
});
