import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { CertificacionesService } from './certificaciones.service';

describe('CertificacionesService', () => {
  let service: CertificacionesService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/certificaciones`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CertificacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista las certificaciones de la empresa autenticada', () => {
    const respuesta = [
      {
        id: '1',
        idAuditoria: 'a1',
        idEmpresa: 'e1',
        idAuditor: 'u1',
        tipo: 'CARBONO_NEUTRAL',
        nombreCertificacion: 'Carbono Neutral',
        fechaEmision: '2026-01-15T00:00:00Z',
        fechaVencimiento: '2027-01-15',
        estado: 'ACTIVA',
        vigente: true,
        urlVerificacion: 'https://carbonhub.example/api/certificaciones/1/verificar',
      },
    ];

    service.listar().subscribe((certificaciones) => {
      expect(certificaciones).toEqual(respuesta);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(respuesta);
  });

  it('obtiene el detalle de una certificacion por id', () => {
    const respuesta = {
      id: '1',
      idAuditoria: 'a1',
      idEmpresa: 'e1',
      idAuditor: 'u1',
      tipo: 'CARBONO_NEUTRAL',
      nombreCertificacion: 'Carbono Neutral',
      fechaEmision: '2026-01-15T00:00:00Z',
      fechaVencimiento: '2027-01-15',
      estado: 'ACTIVA',
      vigente: true,
      urlVerificacion: 'https://carbonhub.example/api/certificaciones/1/verificar',
      recienEmitida: false,
    };

    service.obtener('1').subscribe((certificacion) => {
      expect(certificacion).toEqual(respuesta);
    });

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(respuesta);
  });

  it('descarga la verificacion VC-JWT de una certificacion como blob', () => {
    const blob = new Blob(['header.payload.signature'], { type: 'application/jwt' });

    service.descargarVerificacionJwt('1').subscribe((resultado) => {
      expect(resultado).toEqual(blob);
    });

    const req = httpMock.expectOne(`${baseUrl}/1/verificacion.jwt`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob);
  });
});
