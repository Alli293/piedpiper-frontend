import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PreferenciasService } from './preferencias.service';
import { I18nService } from './i18n.service';
import { Preferencias } from '../models/preferencias.model';

describe('PreferenciasService', () => {
  let service: PreferenciasService;
  let httpMock: HttpTestingController;
  let i18n: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PreferenciasService);
    httpMock = TestBed.inject(HttpTestingController);
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lee las preferencias del perfil al iniciar sesión (GET) y las aplica', () => {
    const guardadas: Preferencias = { idioma: 'INGLES', moneda: 'USD', unidades: 'METRICO' };
    let recibidas: Preferencias | undefined;

    service.cargar().subscribe((p) => (recibidas = p));

    const req = httpMock.expectOne(PreferenciasService.URL);
    expect(req.request.method).toBe('GET');
    req.flush(guardadas);

    expect(recibidas).toEqual(guardadas);
    expect(service.preferencias()).toEqual(guardadas);
    expect(i18n.idioma()).toBe('INGLES');
  });

  it('envía un PUT con las preferencias al endpoint correcto', () => {
    const nuevas: Preferencias = { idioma: 'INGLES', moneda: 'USD', unidades: 'METRICO' };

    service.actualizar(nuevas).subscribe();

    const req = httpMock.expectOne(PreferenciasService.URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(nuevas);
    req.flush(nuevas);

    expect(service.preferencias()).toEqual(nuevas);
  });

  it('no aplica las preferencias si el PUT falla', () => {
    const previas = service.preferencias();
    let fallo = false;

    service
      .actualizar({ idioma: 'INGLES', moneda: 'USD', unidades: 'METRICO' })
      .subscribe({ error: () => (fallo = true) });

    httpMock
      .expectOne(PreferenciasService.URL)
      .flush({ message: 'error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(fallo).toBeTrue();
    expect(service.preferencias()).toEqual(previas);
    expect(i18n.idioma()).toBe('ESPANOL');
  });

  it('los defaults de la sesión son Español, CRC y métrico', () => {
    expect(service.preferencias()).toEqual({
      idioma: 'ESPANOL',
      moneda: 'CRC',
      unidades: 'METRICO',
    });
  });
});
