import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuditoresService } from './auditores.service';
import { FiltrosDirectorio } from './auditor.model';

describe('AuditoresService', () => {
  let service: AuditoresService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/auditores`;
  const catalogosUrl = `${environment.apiBaseUrl}/catalogos`;

  const filtrosBase: FiltrosDirectorio = {
    terminoBusqueda: '',
    especialidades: [],
    zonaGeografica: null,
    calificacionMinima: null,
    soloDisponibles: false,
    pagina: 0,
    ordenamiento: 'CALIFICACION',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuditoresService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditoresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('envia pagina, tamanioPagina, ordenamiento y soloDisponibles', () => {
    service
      .listar({ ...filtrosBase, pagina: 1, ordenamiento: 'AUDITORIAS_COMPLETADAS' })
      .subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('pagina') === '1' &&
        r.params.get('tamanioPagina') === '12' &&
        r.params.get('ordenamiento') === 'AUDITORIAS_COMPLETADAS' &&
        r.params.get('soloDisponibles') === 'false' &&
        !r.params.has('terminoBusqueda') &&
        !r.params.has('especialidades')
    );
    expect(req.request.method).toBe('GET');
    req.flush({ contenido: [], totalResultados: 0, paginaActual: 1, totalPaginas: 0 });
  });

  it('agrega los filtros de especialidad, zona y calificacion como query params', () => {
    service
      .listar({
        ...filtrosBase,
        especialidades: ['AGROINDUSTRIA', 'MANUFACTURA'],
        zonaGeografica: 'SAN_JOSE',
        calificacionMinima: 4,
        soloDisponibles: true,
      })
      .subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.getAll('especialidades')?.join(',') === 'AGROINDUSTRIA,MANUFACTURA' &&
        r.params.get('zonaGeografica') === 'SAN_JOSE' &&
        r.params.get('calificacionMinima') === '4' &&
        r.params.get('soloDisponibles') === 'true'
    );
    req.flush({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 });
  });

  it('incluye terminoBusqueda solo cuando tiene 2 o mas caracteres', () => {
    service.listar({ ...filtrosBase, terminoBusqueda: 'Ana' }).subscribe();
    httpMock
      .expectOne((r) => r.params.get('terminoBusqueda') === 'Ana')
      .flush({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 });

    service.listar({ ...filtrosBase, terminoBusqueda: 'a' }).subscribe();
    httpMock
      .expectOne((r) => !r.params.has('terminoBusqueda'))
      .flush({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 });
  });

  it('consulta los catalogos de especialidades y zonas', () => {
    service.obtenerEspecialidades().subscribe();
    const especialidades = httpMock.expectOne(`${catalogosUrl}/especialidades`);
    expect(especialidades.request.method).toBe('GET');
    especialidades.flush([{ valor: 'AGROINDUSTRIA', etiqueta: 'Agroindustria' }]);

    service.obtenerZonas().subscribe();
    const zonas = httpMock.expectOne(`${catalogosUrl}/zonas`);
    expect(zonas.request.method).toBe('GET');
    zonas.flush([{ valor: 'SAN_JOSE', etiqueta: 'San José' }]);
  });

  it('pide las recomendaciones por POST con los filtros en el cuerpo', () => {
    service
      .recomendar({
        tipoAuditoria: 'MANUFACTURA',
        especialidadBuscada: 'MANUFACTURA',
        zonaGeografica: 'SAN_JOSE',
        soloDisponibles: true,
      })
      .subscribe();

    const req = httpMock.expectOne(`${baseUrl}/recomendaciones`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      tipoAuditoria: 'MANUFACTURA',
      especialidadBuscada: 'MANUFACTURA',
      zonaGeografica: 'SAN_JOSE',
      soloDisponibles: true,
    });
    req.flush({ recomendaciones: [], iaDisponible: true });
  });

  /**
   * El sector y el id de la empresa los resuelve el backend desde el token. Si el cliente los
   * mandara, cualquiera pediría recomendaciones haciéndose pasar por otra empresa.
   */
  it('no envia el sector ni el id de la empresa en el cuerpo', () => {
    service
      .recomendar({
        tipoAuditoria: 'MANUFACTURA',
        especialidadBuscada: 'MANUFACTURA',
        zonaGeografica: 'SAN_JOSE',
        soloDisponibles: false,
      })
      .subscribe();

    const req = httpMock.expectOne(`${baseUrl}/recomendaciones`);
    expect(Object.keys(req.request.body)).toEqual([
      'tipoAuditoria',
      'especialidadBuscada',
      'zonaGeografica',
      'soloDisponibles',
    ]);
    req.flush({ recomendaciones: [], iaDisponible: true });
  });
});
