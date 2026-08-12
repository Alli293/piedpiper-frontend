import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import * as fc from 'fast-check';
import { CalificacionService } from './calificacion.service';
import { AuthService } from '../auth/auth.service';
import { SesionInactividadService } from '../auth/sesion-inactividad.service';
import { jwtInterceptor } from '../auth/jwt.interceptor';
import { environment } from '../../../environments/environment';

/**
 * Feature: PP-56-calificacion-verificada-auditores
 * Property 7: Construcción correcta de peticiones HTTP en el servicio
 * Validates: Requirements 7.1, 7.2
 *
 * For any valid creation payload (auditoriaId, calificacion, comentario) or
 * edit payload (calificacionId, calificacion, comentario), the Angular service
 * SHALL construct an HTTP request to the correct endpoint
 * (POST /api/calificaciones or PUT /api/calificaciones/{calificacionId})
 * with the Authorization header containing the JWT token.
 */
describe('Property 7: Construcción correcta de peticiones HTTP en el servicio', () => {
  let service: CalificacionService;
  let httpMock: HttpTestingController;
  let authServiceStub: { token: () => string | null };
  let sesionInactividadStub: { reiniciar: ReturnType<typeof vi.fn> };

  // -- Arbitraries --

  // UUID-like strings
  const arbUuid = fc.uuid();

  // Calificacion value: integer 1-5
  const arbCalificacion = fc.integer({ min: 1, max: 5 });

  // Comentario: string 0-500 chars or undefined
  const arbComentario = fc.oneof(
    fc.constant(undefined),
    fc.string({ minLength: 0, maxLength: 500 })
  );

  // JWT token: non-empty string simulating a JWT
  const arbToken = fc.string({ minLength: 10, maxLength: 200 }).filter((s) => s.length > 0);

  beforeEach(() => {
    authServiceStub = { token: () => null };
    sesionInactividadStub = { reiniciar: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceStub },
        { provide: SesionInactividadService, useValue: sesionInactividadStub },
      ],
    });

    service = TestBed.inject(CalificacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('crearCalificacion() envía POST a /api/calificaciones con body y Authorization header correctos', () => {
    fc.assert(
      fc.property(
        arbUuid,
        arbCalificacion,
        arbComentario,
        arbToken,
        (auditoriaId, calificacion, comentario, token) => {
          // Configure token for the interceptor
          authServiceStub.token = () => token;

          const payload = { auditoriaId, calificacion, comentario };

          // Subscribe to trigger the HTTP call
          service.crearCalificacion(payload).subscribe();

          const expectedUrl = `${environment.apiBaseUrl}/calificaciones`;
          const req = httpMock.expectOne(expectedUrl);

          // Verify HTTP method
          expect(req.request.method).toBe('POST');

          // Verify request body matches the payload
          expect(req.request.body).toEqual(payload);

          // Verify Authorization header contains the JWT token
          expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);

          // Flush to complete the request
          req.flush({
            id: '00000000-0000-0000-0000-000000000000',
            auditoriaId,
            auditorId: '00000000-0000-0000-0000-000000000001',
            empresaId: '00000000-0000-0000-0000-000000000002',
            calificacion,
            comentario: comentario ?? null,
            creadoEn: '2024-01-01T00:00:00Z',
            actualizadoEn: '2024-01-01T00:00:00Z',
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('editarCalificacion() envía PUT a /api/calificaciones/{calificacionId} con body y Authorization header correctos', () => {
    fc.assert(
      fc.property(
        arbUuid,
        arbCalificacion,
        arbComentario,
        arbToken,
        (calificacionId, calificacion, comentario, token) => {
          // Configure token for the interceptor
          authServiceStub.token = () => token;

          const payload = { calificacion, comentario };

          // Subscribe to trigger the HTTP call
          service.editarCalificacion(calificacionId, payload).subscribe();

          const expectedUrl = `${environment.apiBaseUrl}/calificaciones/${calificacionId}`;
          const req = httpMock.expectOne(expectedUrl);

          // Verify HTTP method
          expect(req.request.method).toBe('PUT');

          // Verify request body matches the payload
          expect(req.request.body).toEqual(payload);

          // Verify Authorization header contains the JWT token
          expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);

          // Flush to complete the request
          req.flush({
            id: calificacionId,
            auditoriaId: '00000000-0000-0000-0000-000000000000',
            auditorId: '00000000-0000-0000-0000-000000000001',
            empresaId: '00000000-0000-0000-0000-000000000002',
            calificacion,
            comentario: comentario ?? null,
            creadoEn: '2024-01-01T00:00:00Z',
            actualizadoEn: '2024-01-01T00:00:00Z',
          });
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);
});

/**
 * Feature: PP-56-calificacion-verificada-auditores
 * Property 8: Propagación transparente de errores HTTP
 * Validates: Requirements 7.5
 *
 * For any respuesta HTTP con código de error (4xx o 5xx) o error de red, el Observable
 * del servicio SHALL propagar el HttpErrorResponse original al componente consumidor
 * sin transformación.
 */
describe('Property 8: Propagación transparente de errores HTTP', () => {
  let service: CalificacionService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/calificaciones`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalificacionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CalificacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('crearCalificacion — propagación de errores HTTP', () => {
    const payload = {
      auditoriaId: 'auditoria-001',
      calificacion: 4,
      comentario: 'Buen trabajo',
    };

    it('propaga errores HTTP sin transformación para cualquier código de error (4xx-5xx)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (statusCode, errorMessage) => {
            const errorBody = { message: errorMessage };
            let receivedError: HttpErrorResponse | undefined;

            service.crearCalificacion(payload).subscribe({
              error: (err) => (receivedError = err),
            });

            const req = httpMock.expectOne(baseUrl);
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

      service.crearCalificacion(payload).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(baseUrl);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(receivedError).toBeInstanceOf(HttpErrorResponse);
      expect(receivedError!.status).toBe(0);
    });
  });

  describe('editarCalificacion — propagación de errores HTTP', () => {
    const calificacionId = 'calificacion-001';
    const payload = {
      calificacion: 3,
      comentario: 'Actualizado',
    };

    it('propaga errores HTTP sin transformación para cualquier código de error (4xx-5xx)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (statusCode, errorMessage) => {
            const errorBody = { message: errorMessage };
            let receivedError: HttpErrorResponse | undefined;

            service.editarCalificacion(calificacionId, payload).subscribe({
              error: (err) => (receivedError = err),
            });

            const req = httpMock.expectOne(`${baseUrl}/${calificacionId}`);
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

      service.editarCalificacion(calificacionId, payload).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/${calificacionId}`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(receivedError).toBeInstanceOf(HttpErrorResponse);
      expect(receivedError!.status).toBe(0);
    });
  });

  describe('obtenerPorAuditoria — propagación de errores HTTP (excepto 404)', () => {
    const auditoriaId = 'auditoria-001';

    it('propaga errores HTTP sin transformación para códigos != 404', () => {
      const nonNotFoundCodes = fc.integer({ min: 400, max: 599 }).filter((code) => code !== 404);

      fc.assert(
        fc.property(
          nonNotFoundCodes,
          fc.string({ minLength: 1, maxLength: 100 }),
          (statusCode, errorMessage) => {
            const errorBody = { message: errorMessage };
            let receivedError: HttpErrorResponse | undefined;

            service.obtenerPorAuditoria(auditoriaId).subscribe({
              error: (err) => (receivedError = err),
            });

            const req = httpMock.expectOne(`${baseUrl}/auditoria/${auditoriaId}`);
            req.flush(errorBody, { status: statusCode, statusText: 'Error' });

            expect(receivedError).toBeInstanceOf(HttpErrorResponse);
            expect(receivedError!.status).toBe(statusCode);
            expect(receivedError!.error).toEqual(errorBody);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('convierte 404 a null (no propaga error)', () => {
      let resultado: unknown;
      let receivedError: HttpErrorResponse | undefined;

      service.obtenerPorAuditoria(auditoriaId).subscribe({
        next: (val) => (resultado = val),
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/auditoria/${auditoriaId}`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

      expect(receivedError).toBeUndefined();
      expect(resultado).toBeNull();
    });

    it('propaga error de red sin transformación', () => {
      let receivedError: HttpErrorResponse | undefined;

      service.obtenerPorAuditoria(auditoriaId).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/auditoria/${auditoriaId}`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(receivedError).toBeInstanceOf(HttpErrorResponse);
      expect(receivedError!.status).toBe(0);
    });
  });
});
