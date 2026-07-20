import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmpresaService } from './empresa.service';
import { environment } from '../../../environments/environment';

describe('EmpresaService', () => {
  let service: EmpresaService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/empresas`;

  const request = {
    nombreEmpresa: 'Café del Valle S.A.',
    cedulaJuridica: '3-101-123456',
    sectorIndustrial: 'AGROINDUSTRIA' as const,
    pais: 'CR',
    cantidadEmpleados: 12,
    descripcion: 'Producción y exportación de café.',
  };

  const respuesta = {
    empresaId: 'a1b2c3',
    nombreEmpresa: 'Café del Valle S.A.',
    slug: 'cafe-del-valle-sa',
    documentosPendientes: true,
    recienCreada: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmpresaService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmpresaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('completarConfiguracionEmpresa hace POST a /empresas/configuracion-inicial (no a /auth/...)', () => {
    let recibida;
    service.completarConfiguracionEmpresa(request).subscribe((r) => (recibida = r));

    const req = httpMock.expectOne(`${base}/configuracion-inicial`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(respuesta);

    expect(recibida).toEqual(respuesta);
  });
});
