import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { CertificacionPublica, InsigniaEmpresa } from './perfil-publico.models';
import { PerfilPublicoService } from './perfil-publico.service';

describe('PerfilPublicoService', () => {
  let service: PerfilPublicoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/perfil-publico`;

  const certificacion: CertificacionPublica = {
    id: 'cert-1',
    tipo: 'CARBONO_NEUTRAL',
    nombreCertificacion: 'Carbono Neutral',
    fechaEmision: '2026-01-15T00:00:00Z',
    fechaVencimiento: '2027-01-15',
    estado: 'ACTIVA',
  };

  const insignia: InsigniaEmpresa = {
    idInsignia: 1,
    nivelInsignia: 'bronce',
    nombre: 'Carbono Neutral',
    descripcion: 'Primera insignia empresarial.',
    fechaObtencion: '2026-01-15T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PerfilPublicoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PerfilPublicoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('hace GET a /api/perfil-publico/{slug}/certificaciones y mapea el arreglo', () => {
    let resultado: CertificacionPublica[] | undefined;
    service.listarCertificaciones('cafe-del-valle').subscribe((valor) => (resultado = valor));

    const req = httpMock.expectOne(`${baseUrl}/cafe-del-valle/certificaciones`);
    expect(req.request.method).toBe('GET');
    req.flush([certificacion]);

    expect(resultado).toEqual([certificacion]);
  });

  it('escapa el slug en la URL', () => {
    service.listarCertificaciones('empresa con espacio').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/empresa%20con%20espacio/certificaciones`);
    req.flush([]);
  });

  it('hace GET a /api/perfil-publico/{slug}/insignias y mapea el arreglo', () => {
    let resultado: InsigniaEmpresa[] | undefined;
    service.listarInsignias('cafe-del-valle').subscribe((valor) => (resultado = valor));

    const req = httpMock.expectOne(`${baseUrl}/cafe-del-valle/insignias`);
    expect(req.request.method).toBe('GET');
    req.flush([insignia]);

    expect(resultado).toEqual([insignia]);
  });

  it('descarga una insignia publica como blob JSON-LD', () => {
    const urlVerificacion =
      'https://carbonhub.test/api/insignias/11111111-1111-1111-1111-111111111111/verificacion';
    let recibida: Blob | undefined;

    service.descargarInsigniaJsonLd(urlVerificacion).subscribe((valor) => (recibida = valor));

    const req = httpMock.expectOne(urlVerificacion);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');

    const blob = new Blob(['{}'], { type: 'application/ld+json' });
    req.flush(blob);

    expect(recibida).toBe(blob);
  });

  it('descarga una insignia publica como blob JWT verificable', () => {
    const urlJwt =
      'https://carbonhub.test/api/insignias/11111111-1111-1111-1111-111111111111/verificacion.jwt';
    let recibida: Blob | undefined;

    service.descargarInsigniaJwt(urlJwt).subscribe((valor) => (recibida = valor));

    const req = httpMock.expectOne(urlJwt);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');

    const blob = new Blob(['header.payload.signature'], { type: 'application/vc+ld+json+jwt' });
    req.flush(blob);

    expect(recibida).toBe(blob);
  });

  it('propaga un 404 al llamador en vez de silenciarlo', () => {
    let error: unknown;
    service.listarCertificaciones('no-existe').subscribe({
      error: (err) => (error = err),
    });

    httpMock
      .expectOne(`${baseUrl}/no-existe/certificaciones`)
      .flush(
        { status: 404, message: 'La empresa no existe.', timestamp: '2026-07-26T00:00:00Z' },
        { status: 404, statusText: 'Not Found' }
      );

    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect((error as HttpErrorResponse).status).toBe(404);
  });
});
