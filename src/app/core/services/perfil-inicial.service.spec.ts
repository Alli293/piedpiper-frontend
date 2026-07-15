import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PerfilInicialService } from './perfil-inicial.service';
import { PerfilInicial } from '../models/perfil-inicial.model';

describe('PerfilInicialService', () => {
  let service: PerfilInicialService;
  let httpMock: HttpTestingController;

  const perfil: PerfilInicial = {
    nombreVisible: 'Ana',
    preferencias: { idioma: 'ESPANOL', moneda: 'CRC', unidades: 'METRICO' },
    rol: 'USUARIO_INDIVIDUAL',
    configuracionCompleta: false,
    redirect: '/perfil/configuracion-inicial',
    empresa: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PerfilInicialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obtiene el perfil inicial con GET al endpoint', () => {
    let recibido: PerfilInicial | undefined;
    service.obtener().subscribe((p) => (recibido = p));

    const req = httpMock.expectOne(PerfilInicialService.URL);
    expect(req.request.method).toBe('GET');
    req.flush(perfil);

    expect(recibido).toEqual(perfil);
  });

  it('completa el perfil con PUT al endpoint y el cuerpo esperado', () => {
    const request = {
      nombreVisible: 'Ana G.',
      preferencias: { idioma: 'INGLES' as const, moneda: 'USD' as const, unidades: 'METRICO' as const },
    };
    let recibido: PerfilInicial | undefined;
    service.completar(request).subscribe((p) => (recibido = p));

    const req = httpMock.expectOne(PerfilInicialService.URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ ...perfil, nombreVisible: 'Ana G.', configuracionCompleta: true, redirect: '/panel' });

    expect(recibido?.configuracionCompleta).toBe(true);
    expect(recibido?.redirect).toBe('/panel');
  });
});
