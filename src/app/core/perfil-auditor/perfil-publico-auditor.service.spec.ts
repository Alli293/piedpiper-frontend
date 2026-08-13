import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { PerfilPublicoAuditorResponse } from '../models/perfil-publico-auditor.model';
import { PerfilPublicoAuditorService } from './perfil-publico-auditor.service';

describe('PerfilPublicoAuditorService', () => {
  let service: PerfilPublicoAuditorService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/auditores`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PerfilPublicoAuditorService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PerfilPublicoAuditorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('obtenerPerfilPublico', () => {
    const auditorId = '550e8400-e29b-41d4-a716-446655440000';

    it('envía GET a /api/auditores/{auditorId} con el auditorId correcto', () => {
      const mockPerfil: PerfilPublicoAuditorResponse = {
        auditorId,
        nombre: 'Juan Pérez Solano',
        fotoPerfil: 'https://storage.example.com/foto.jpg',
        descripcionProfesional: 'Auditor con 10 años de experiencia',
        especialidades: ['HUELLA_CARBONO', 'ENERGIA_RENOVABLE'],
        certificaciones: [
          {
            nombre: 'ISO 14064',
            entidadCertificadora: 'SGS',
            fechaVigencia: '2025-12-31',
            vencida: false,
          },
        ],
        disponible: true,
        calificacionPromedio: 4.5,
        totalResenas: 12,
        auditoriasCompletadas: 8,
        tiempoPromedioRespuestaDias: 2.3,
        distribucionSectores: [
          { sector: 'Energía', porcentaje: 45.0 },
          { sector: 'Manufactura', porcentaje: 55.0 },
        ],
        resenas: [
          {
            id: 'cal-001',
            empresaId: 'empresa-abc',
            calificacion: 5.0,
            comentario: 'Excelente trabajo.',
            fechaCalificacion: '2025-01-15',
          },
        ],
      };

      let resultado: PerfilPublicoAuditorResponse | undefined;
      service.obtenerPerfilPublico(auditorId).subscribe((r) => (resultado = r));

      const req = httpMock.expectOne(`${baseUrl}/${auditorId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPerfil);

      expect(resultado).toEqual(mockPerfil);
    });

    it('construye la URL correcta con distintos auditorId', () => {
      const otroId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      service.obtenerPerfilPublico(otroId).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/${otroId}`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('propagación de errores HTTP', () => {
    const auditorId = '550e8400-e29b-41d4-a716-446655440000';

    it('propaga HttpErrorResponse 404 sin transformación', () => {
      const errorBody = { message: 'El perfil solicitado no está disponible.' };
      let receivedError: HttpErrorResponse | undefined;

      service.obtenerPerfilPublico(auditorId).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/${auditorId}`);
      req.flush(errorBody, { status: 404, statusText: 'Not Found' });

      expect(receivedError).toBeInstanceOf(HttpErrorResponse);
      expect(receivedError!.status).toBe(404);
      expect(receivedError!.error).toEqual(errorBody);
    });

    it('propaga HttpErrorResponse 500 sin transformación', () => {
      const errorBody = { message: 'Error interno del servidor.' };
      let receivedError: HttpErrorResponse | undefined;

      service.obtenerPerfilPublico(auditorId).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/${auditorId}`);
      req.flush(errorBody, { status: 500, statusText: 'Internal Server Error' });

      expect(receivedError).toBeInstanceOf(HttpErrorResponse);
      expect(receivedError!.status).toBe(500);
      expect(receivedError!.error).toEqual(errorBody);
    });

    it('propaga error de red (status 0) sin transformación', () => {
      let receivedError: HttpErrorResponse | undefined;

      service.obtenerPerfilPublico(auditorId).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/${auditorId}`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(receivedError).toBeInstanceOf(HttpErrorResponse);
      expect(receivedError!.status).toBe(0);
    });

    it('propaga HttpErrorResponse 401 sin transformación', () => {
      const errorBody = { message: 'No autorizado.' };
      let receivedError: HttpErrorResponse | undefined;

      service.obtenerPerfilPublico(auditorId).subscribe({
        error: (err) => (receivedError = err),
      });

      const req = httpMock.expectOne(`${baseUrl}/${auditorId}`);
      req.flush(errorBody, { status: 401, statusText: 'Unauthorized' });

      expect(receivedError).toBeInstanceOf(HttpErrorResponse);
      expect(receivedError!.status).toBe(401);
      expect(receivedError!.error).toEqual(errorBody);
    });
  });
});
