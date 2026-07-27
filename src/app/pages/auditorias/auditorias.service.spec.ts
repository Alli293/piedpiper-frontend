import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuditoriasService } from './auditorias.service';
import { NuevaSolicitudAuditoriaRequest } from './auditoria.model';

describe('AuditoriasService', () => {
  let service: AuditoriasService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/auditorias`;

  const datos: NuevaSolicitudAuditoriaRequest = {
    periodoInicio: '2025-01-01',
    periodoFin: '2025-06-30',
    descripcionSolicitud: 'Auditoría anual',
  };

  function pdf(nombre: string): File {
    return new File(['contenido'], nombre, { type: 'application/pdf' });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuditoriasService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditoriasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('envia la parte datos como JSON y una parte documentos por archivo', async () => {
    service.crearSolicitud(datos, [pdf('uno.pdf'), pdf('dos.pdf')]).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');

    const body = req.request.body as FormData;
    const parteDatos = body.get('datos') as Blob;
    expect(parteDatos.type).toBe('application/json');
    expect(JSON.parse(await parteDatos.text())).toEqual(datos);

    const documentos = body.getAll('documentos') as File[];
    expect(documentos.map((documento) => documento.name)).toEqual(['uno.pdf', 'dos.pdf']);

    req.flush({ id: 'sol-1', documentos: [] });
  });

  it('permite enviar la descripcion en null', async () => {
    service.crearSolicitud({ ...datos, descripcionSolicitud: null }, [pdf('uno.pdf')]).subscribe();

    const req = httpMock.expectOne(baseUrl);
    const body = req.request.body as FormData;
    const parteDatos = JSON.parse(await (body.get('datos') as Blob).text());

    expect(parteDatos.descripcionSolicitud).toBeNull();
    expect(body.getAll('documentos').length).toBe(1);

    req.flush({ id: 'sol-2', documentos: [] });
  });
});
