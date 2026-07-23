import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { environment } from '../../../environments/environment';
import { ActualizarPerfilRequest } from '../models/perfil-auditor.model';
import { PerfilAuditorService } from './perfil-auditor.service';

describe('PerfilAuditorService', () => {
  let service: PerfilAuditorService;
  let httpMock: HttpTestingController;
  const baseAuditores = `${environment.apiBaseUrl}/auditores`;
  const baseCatalogos = `${environment.apiBaseUrl}/catalogos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PerfilAuditorService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PerfilAuditorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('actualizarPerfil', () => {
    const auditorId = 'abc-123';
    const dto: ActualizarPerfilRequest = {
      especialidades: ['HUELLA_CARBONO', 'ENERGIA_RENOVABLE'],
      zonasCobertura: ['SAN_JOSE'],
      disponible: true,
      descripcionProfesional: 'Descripción de prueba',
    };

    it('envía PUT a /api/auditores/{auditorId}/perfil con el DTO como body', () => {
      const mockResponse = {
        auditorId,
        especialidades: dto.especialidades,
        zonasCobertura: dto.zonasCobertura,
        disponible: dto.disponible,
        descripcionProfesional: dto.descripcionProfesional,
        actualizadoEn: '2025-01-01T00:00:00Z',
      };

      let resultado: any;
      service.actualizarPerfil(auditorId, dto).subscribe((r) => (resultado = r));

      const req = httpMock.expectOne(`${baseAuditores}/${auditorId}/perfil`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);

      expect(resultado).toEqual(mockResponse);
    });
  });

  describe('obtenerEspecialidades', () => {
    it('envía GET a /api/catalogos/especialidades', () => {
      const mockEspecialidades = [
        { valor: 'HUELLA_CARBONO', etiqueta: 'Huella carbono' },
        { valor: 'ENERGIA_RENOVABLE', etiqueta: 'Energia renovable' },
      ];

      let resultado: any;
      service.obtenerEspecialidades().subscribe((r) => (resultado = r));

      const req = httpMock.expectOne(`${baseCatalogos}/especialidades`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEspecialidades);

      expect(resultado).toEqual(mockEspecialidades);
    });
  });

  describe('obtenerZonasCobertura', () => {
    it('envía GET a /api/catalogos/zonas', () => {
      const mockZonas = [
        { valor: 'SAN_JOSE', etiqueta: 'San jose' },
        { valor: 'HEREDIA', etiqueta: 'Heredia' },
      ];

      let resultado: any;
      service.obtenerZonasCobertura().subscribe((r) => (resultado = r));

      const req = httpMock.expectOne(`${baseCatalogos}/zonas`);
      expect(req.request.method).toBe('GET');
      req.flush(mockZonas);

      expect(resultado).toEqual(mockZonas);
    });
  });

  /**
   * Property 10: Frontend service error propagation
   * Validates: Requirements 7.3
   *
   * For any HTTP error response (4xx, 5xx, or network error) from the backend,
   * the PerfilAuditorService.actualizarPerfil() Observable SHALL propagate the
   * error to the subscriber without transformation.
   */
  describe('Property 10: Frontend service error propagation', () => {
    const auditorId = 'test-auditor-id';
    const dto: ActualizarPerfilRequest = {
      especialidades: ['HUELLA_CARBONO'],
      zonasCobertura: ['SAN_JOSE'],
      disponible: true,
      descripcionProfesional: null,
    };

    it('propaga errores HTTP sin transformación para cualquier código de error', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (statusCode, errorMessage) => {
            const errorBody = { message: errorMessage };
            let receivedError: HttpErrorResponse | undefined;

            service.actualizarPerfil(auditorId, dto).subscribe({
              error: (err) => (receivedError = err),
            });

            const req = httpMock.expectOne(`${baseAuditores}/${auditorId}/perfil`);
            req.flush(errorBody, { status: statusCode, statusText: 'Error' });

            expect(receivedError).toBeInstanceOf(HttpErrorResponse);
            expect(receivedError!.status).toBe(statusCode);
            expect(receivedError!.error).toEqual(errorBody);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('propaga error de red sin transformación', () => {
      let receivedError: HttpErrorResponse | undefined;

      service.actualizarPerfil(auditorId, dto).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${baseAuditores}/${auditorId}/perfil`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(receivedError).toBeInstanceOf(HttpErrorResponse);
      expect(receivedError!.status).toBe(0);
    });
  });
});
