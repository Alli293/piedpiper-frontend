import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EmisionesService } from './emisiones.service';
import { RegistrarElectricidadRequest } from './models/emision.model';

describe('EmisionesService', () => {
  let service: EmisionesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmisionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts the expected body to /api/emisiones/electricidad', () => {
    const payload: RegistrarElectricidadRequest = {
      titulo: 'Planta de tueste — Heredia',
      electricityValue: 500,
      electricityUnit: 'kwh',
      fechaActividad: '2026-07-09',
    };

    service.registrarElectricidad(payload).subscribe();

    const req = httpMock.expectOne('/api/emisiones/electricidad');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      id: '1',
      categoria: 'ELECTRICIDAD',
      titulo: payload.titulo,
      fechaActividad: payload.fechaActividad,
      electricityValue: payload.electricityValue,
      electricityUnit: payload.electricityUnit,
      carbonKg: 347,
      carbonMt: 0.347,
      factorEmisionId: 'factor-1',
      estimatedAt: '2026-07-09T00:00:00Z',
      createdAt: '2026-07-09T00:00:00Z',
    });
  });
});
