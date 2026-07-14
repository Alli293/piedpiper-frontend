import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Invitacion, InvitacionesService } from './invitaciones.service';
import { environment } from '../../../environments/environment';

describe('InvitacionesService', () => {
  let service: InvitacionesService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiBaseUrl}/empresas/invitaciones`;

  const invitacion: Invitacion = {
    id: 'inv-1',
    email: 'colab@correo.com',
    estado: 'ENVIADA',
    fechaEmision: '2026-07-14T00:00:00Z',
    fechaExpiracion: '2026-07-21T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InvitacionesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(InvitacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('emitir hace POST con el correo invitado', () => {
    service.emitir('colab@correo.com').subscribe((r) => expect(r).toEqual(invitacion));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'colab@correo.com' });
    req.flush(invitacion);
  });

  it('listar hace GET al endpoint de invitaciones', () => {
    service.listar().subscribe((r) => expect(r).toEqual([invitacion]));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([invitacion]);
  });

  it('revocar hace POST a la accion de revocar', () => {
    service.revocar('inv-1').subscribe((r) => expect(r.estado).toBe('REVOCADA'));

    const req = httpMock.expectOne(`${base}/inv-1/revocar`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...invitacion, estado: 'REVOCADA' });
  });

  it('resolver hace GET al endpoint publico con el token', () => {
    service.resolver('tok-123').subscribe((r) => expect(r.nombreEmpresa).toBe('Acme S.A.'));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/invitaciones/tok-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ email: 'colab@correo.com', nombreEmpresa: 'Acme S.A.' });
  });
});
