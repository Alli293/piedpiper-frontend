import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmisionesService } from './emisiones.service';
import { environment } from '../../../environments/environment';
import { RegistrarElectricidadRequest, RegistrarFlotaRequest } from './models/emision.model';

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
      distanceUnit: 'km' as const,
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

  it('listarEmisiones envia los query params de filtros', () => {
    service.listarEmisiones({ categoria: 'FLOTA', anio: 2026, mes: 7 }).subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url === base &&
        request.params.get('categoria') === 'FLOTA' &&
        request.params.get('anio') === '2026' &&
        request.params.get('mes') === '7'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('listarEmisiones omite categoria cuando el filtro es TODAS', () => {
    service.listarEmisiones({ categoria: 'TODAS' }).subscribe();

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('categoria')).toBeFalsy();
    req.flush([]);
  });

  it('eliminarEmision hace DELETE al endpoint con el id', () => {
    service.eliminarEmision('registro-1').subscribe();

    const req = httpMock.expectOne(`${base}/registro-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('posts the expected body to /emisiones/vuelo', () => {
    const payload = {
      passengers: 2,
      distanceUnit: 'km' as const,
      fechaActividad: '2026-07-09',
      legs: [
        { departureAirport: 'SFO', destinationAirport: 'YYZ', cabinClass: 'economy' as const },
        { departureAirport: 'YYZ', destinationAirport: 'SFO', cabinClass: 'economy' as const },
      ],
    };

    service.registrarVuelo(payload).subscribe();

    const req = httpMock.expectOne(`${base}/vuelo`);
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

  it('gets the vehicle type catalog from /api/emisiones/flota/tipos-vehiculo', () => {
    service.obtenerTiposVehiculo().subscribe();

    const req = httpMock.expectOne('/api/emisiones/flota/tipos-vehiculo');
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        id: 'AUTOMOVIL',
        nombre: 'Automóvil / SUV',
        combustibles: [{ id: 'GASOLINA', nombre: 'Gasolina' }],
      },
    ]);
  });

  it('posts the expected body to /api/emisiones/flota', () => {
    const payload: RegistrarFlotaRequest = {
      titulo: 'Ruta de reparto',
      tipoVehiculo: 'AUTOMOVIL',
      combustible: 'GASOLINA',
      distanceValue: 100,
      distanceUnit: 'km',
      fechaActividad: '2026-07-09',
    };

    service.registrarFlota(payload).subscribe();

    const req = httpMock.expectOne('/api/emisiones/flota');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      id: '2',
      categoria: 'FLOTA',
      titulo: payload.titulo,
      fechaActividad: payload.fechaActividad,
      tipoVehiculo: payload.tipoVehiculo,
      combustible: payload.combustible,
      distanceValue: payload.distanceValue,
      distanceUnit: payload.distanceUnit,
      carbonKg: 21,
      carbonMt: 0.021,
      factorEmisionId: 'factor-2',
      estimatedAt: '2026-07-09T00:00:00Z',
      createdAt: '2026-07-09T00:00:00Z',
    });
  });
});
