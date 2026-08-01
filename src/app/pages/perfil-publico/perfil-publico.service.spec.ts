import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { environment } from '../../../environments/environment';
import { CertificacionPublica, InsigniaEmpresa, PerfilPublicoDTO } from './perfil-publico.models';
import { PerfilPublicoService } from './perfil-publico.service';

describe('PerfilPublicoService', () => {
  let service: PerfilPublicoService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/perfil-publico`;

  const perfilMock: PerfilPublicoDTO = {
    nombreEmpresa: 'Café del Valle',
    logoUrl: 'https://example.com/logo.png',
    sectorIndustrial: 'Agricultura',
    pais: 'Costa Rica',
    nivelEcologico: 'Oro',
    fechaActualizacionNivel: '2025-06-15T10:30:00Z',
    certificacionesVigentes: 3,
    insigniasActivas: 5,
  };

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

  describe('obtenerPerfil', () => {
    it('hace GET a /api/perfil-publico/{slug} y retorna PerfilPublicoDTO', () => {
      let resultado: PerfilPublicoDTO | undefined;
      service.obtenerPerfil('cafe-del-valle').subscribe((valor) => (resultado = valor));

      const req = httpMock.expectOne(`${baseUrl}/cafe-del-valle`);
      expect(req.request.method).toBe('GET');
      req.flush(perfilMock);

      expect(resultado).toEqual(perfilMock);
    });

    it('emite error sin hacer petición HTTP cuando el slug es vacío', () => {
      let error: unknown;
      service.obtenerPerfil('').subscribe({
        error: (err) => (error = err),
      });

      httpMock.expectNone(`${baseUrl}/`);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('El slug no puede estar vacío.');
    });

    it('emite error sin hacer petición HTTP cuando el slug es solo espacios', () => {
      let error: unknown;
      service.obtenerPerfil('   ').subscribe({
        error: (err) => (error = err),
      });

      httpMock.expectNone(`${baseUrl}/   `);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('El slug no puede estar vacío.');
    });

    it('propaga HttpErrorResponse 404 sin transformar', () => {
      let error: unknown;
      service.obtenerPerfil('no-existe').subscribe({
        error: (err) => (error = err),
      });

      httpMock
        .expectOne(`${baseUrl}/no-existe`)
        .flush(
          { mensaje: 'El perfil que buscas no existe o ya no está disponible.' },
          { status: 404, statusText: 'Not Found' }
        );

      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(404);
    });

    it('propaga HttpErrorResponse 500 sin transformar', () => {
      let error: unknown;
      service.obtenerPerfil('cafe-del-valle').subscribe({
        error: (err) => (error = err),
      });

      httpMock
        .expectOne(`${baseUrl}/cafe-del-valle`)
        .flush(
          { mensaje: 'No fue posible cargar el perfil en este momento. Intenta nuevamente más tarde.' },
          { status: 500, statusText: 'Internal Server Error' }
        );

      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(500);
    });
  });

  describe('listarCertificaciones', () => {
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

  describe('listarInsignias', () => {
    it('hace GET a /api/perfil-publico/{slug}/insignias y mapea el arreglo', () => {
      let resultado: InsigniaEmpresa[] | undefined;
      service.listarInsignias('cafe-del-valle').subscribe((valor) => (resultado = valor));

      const req = httpMock.expectOne(`${baseUrl}/cafe-del-valle/insignias`);
      expect(req.request.method).toBe('GET');
      req.flush([insignia]);

      expect(resultado).toEqual([insignia]);
    });

    it('propaga un 404 al llamador en vez de silenciarlo', () => {
      let error: unknown;
      service.listarInsignias('no-existe').subscribe({
        error: (err) => (error = err),
      });

      httpMock
        .expectOne(`${baseUrl}/no-existe/insignias`)
        .flush(
          { status: 404, message: 'La empresa no existe.', timestamp: '2026-07-26T00:00:00Z' },
          { status: 404, statusText: 'Not Found' }
        );

      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).status).toBe(404);
    });
  });

  describe('Property tests (fast-check)', () => {
    /**
     * Property 11: Slug vacío no genera petición HTTP
     * Para cualquier cadena vacía o compuesta exclusivamente de caracteres de espacio en blanco,
     * el servicio frontend emite un error síncrono a través del Observable sin realizar petición HTTP.
     *
     * Validates: Requirements 7.4
     */
    it('Property 11: Slug vacío no genera petición HTTP', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', ' ', '  ', '\t', '\n', '   \t\n  '),
          (emptySlug) => {
            let error: unknown;
            service.obtenerPerfil(emptySlug).subscribe({
              error: (err) => (error = err),
            });
            httpMock.expectNone(() => true);
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBe('El slug no puede estar vacío.');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 12: Propagación transparente de errores HTTP
     * Para cualquier código de error HTTP (4xx o 5xx) retornado por el backend,
     * el servicio propaga el error como HttpErrorResponse sin transformar.
     *
     * Validates: Requirements 7.3
     */
    it('Property 12: Propagación transparente de errores HTTP', () => {
      fc.assert(
        fc.property(fc.integer({ min: 400, max: 599 }), (statusCode) => {
          let error: unknown;
          service.obtenerPerfil('valid-slug').subscribe({
            error: (err) => (error = err),
          });
          httpMock
            .expectOne(`${baseUrl}/valid-slug`)
            .flush({ mensaje: 'Error test' }, { status: statusCode, statusText: 'Error' });
          expect(error).toBeInstanceOf(HttpErrorResponse);
          expect((error as HttpErrorResponse).status).toBe(statusCode);
        }),
        { numRuns: 100 }
      );
    });
  });
});
