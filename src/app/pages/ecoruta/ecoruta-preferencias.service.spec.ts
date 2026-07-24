import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { EcoRutaPreferenciasService } from './ecoruta-preferencias.service';
import { PreferenciasViajeRequest } from './models/preferencias-viaje.model';

describe('EcoRutaPreferenciasService', () => {
  let service: EcoRutaPreferenciasService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/ecoruta/preferencias`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EcoRutaPreferenciasService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EcoRutaPreferenciasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('obtiene las preferencias guardadas', () => {
    service.obtener().subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({
      id: '1',
      cantidadDias: 5,
      fechaInicio: '2026-08-01',
      tipoViaje: 'FAMILIA',
      presupuesto: 'MODERADO',
      intereses: ['NATURALEZA', 'AVENTURA'],
      provinciaPreferida: 'SAN_JOSE',
      ubicacionActual: 'San José, Costa Rica',
      buscarCercaDeMi: true,
      limitacionesMovilidad: null,
      requiereHospedaje: false,
      conversacionCompleta: true,
      recienCreada: false,
    });
  });

  it('envia el cuerpo completo al guardar preferencias', () => {
    const request: PreferenciasViajeRequest = {
      cantidadDias: 5,
      fechaInicio: '2026-08-01',
      tipoViaje: 'FAMILIA',
      presupuesto: 'MODERADO',
      intereses: ['NATURALEZA', 'AVENTURA'],
      provinciaPreferida: 'SAN_JOSE',
      ubicacionActual: 'San José, Costa Rica',
      buscarCercaDeMi: true,
      limitacionesMovilidad: null,
      requiereHospedaje: false,
    };

    service.guardar(request).subscribe();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ ...request, id: '1', conversacionCompleta: true, recienCreada: true });
  });
});
