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

  /**
   * El punto más frágil de la integración del listado: `@ModelAttribute` arma la lista de estados
   * a partir de parámetros **repetidos**, no de uno separado por comas. Si esto cambia, el filtro
   * deja de aplicarse en el servidor sin ningún error visible en el cliente.
   */
  it('listar manda cada estado como un parametro filtroEstado repetido', () => {
    service.listar({ filtroEstado: ['EN_REVISION', 'REPORTE_CARGADO'], pagina: 2 }).subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.getAll('filtroEstado')).toEqual(['EN_REVISION', 'REPORTE_CARGADO']);
    expect(req.request.params.get('pagina')).toBe('2');

    req.flush({
      contenido: [],
      totalResultados: 0,
      paginaActual: 2,
      totalPaginas: 0,
      tamanioPagina: 25,
    });
  });

  it('listar sin filtros pide la pagina 1 y no manda filtroEstado', () => {
    service.listar().subscribe();

    const req = httpMock.expectOne((r) => r.url === baseUrl);
    // getAll devuelve null, no [], cuando el parametro no viaja: es la diferencia entre "sin
    // filtro" y "filtro vacio", y el backend las trata distinto.
    expect(req.request.params.getAll('filtroEstado')).toBeNull();
    expect(req.request.params.get('pagina')).toBe('1');

    req.flush({
      contenido: [],
      totalResultados: 0,
      paginaActual: 1,
      totalPaginas: 0,
      tamanioPagina: 25,
    });
  });

  it('consulta la solicitud con GET al endpoint de la solicitud', () => {
    service.obtenerSolicitud('sol-9').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/sol-9`);
    expect(req.request.method).toBe('GET');

    req.flush({
      id: 'sol-9',
      documentos: [],
      auditor: { id: 'aud-1', nombre: 'Ana Mora' },
      origenAsignacion: 'MANUAL',
    });
  });

  it('asigna el auditor con POST al endpoint de la solicitud', () => {
    service.asignarAuditor('sol-9', { idAuditor: 'aud-1', origenAsignacion: 'manual' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/sol-9/auditor`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ idAuditor: 'aud-1', origenAsignacion: 'manual' });

    req.flush({ id: 'sol-9', documentos: [], auditor: { id: 'aud-1', nombre: 'Ana Mora' } });
  });

  /**
   * Contrato del servicio, no de la pantalla: hoy la UI siempre envía `manual`, pero el endpoint
   * acepta ambos orígenes y este test fija que el valor viaja tal cual en el cuerpo.
   */
  it('serializa el origen recomendacion_ia tal cual en el cuerpo del POST', () => {
    service
      .asignarAuditor('sol-9', { idAuditor: 'aud-2', origenAsignacion: 'recomendacion_ia' })
      .subscribe();

    const req = httpMock.expectOne(`${baseUrl}/sol-9/auditor`);
    expect(req.request.body).toEqual({ idAuditor: 'aud-2', origenAsignacion: 'recomendacion_ia' });

    req.flush({ id: 'sol-9', documentos: [] });
  });

  it('cargarReporte hace POST multipart con el archivo y la fecha', () => {
    const archivo = pdf('reporte.pdf');

    service.cargarReporte('sol-9', archivo, '2026-07-28').subscribe();

    const req = httpMock.expectOne(`${baseUrl}/sol-9/reporte`);
    expect(req.request.method).toBe('POST');

    const body = req.request.body as FormData;
    expect((body.get('reporteAuditoria') as File).name).toBe('reporte.pdf');
    expect((body.get('reporteAuditoria') as File).type).toBe('application/pdf');
    expect(body.get('fechaAuditoriaRealizada')).toBe('2026-07-28');

    req.flush({ id: 'sol-9', documentos: [], historial: [] });
  });

  it('emitirResultado hace POST al endpoint de resultado', () => {
    service.emitirResultado('sol-9', { resultado: 'aprobada' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/sol-9/resultado`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ resultado: 'aprobada' });

    req.flush({ id: 'sol-9', documentos: [], historial: [] });
  });
});
