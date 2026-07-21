import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuditoresService } from './auditores.service';

describe('AuditoresService', () => {
  let service: AuditoresService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/auditores`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuditoresService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditoresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('envia pagina, tamanioPagina y ordenamiento como query params', () => {
    service
      .listar({ terminoBusqueda: '', pagina: 1, ordenamiento: 'AUDITORIAS_COMPLETADAS' })
      .subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === baseUrl &&
        r.params.get('pagina') === '1' &&
        r.params.get('tamanioPagina') === '12' &&
        r.params.get('ordenamiento') === 'AUDITORIAS_COMPLETADAS' &&
        !r.params.has('terminoBusqueda')
    );
    expect(req.request.method).toBe('GET');
    req.flush({ contenido: [], totalResultados: 0, paginaActual: 1, totalPaginas: 0 });
  });

  it('incluye terminoBusqueda solo cuando tiene 2 o mas caracteres', () => {
    service.listar({ terminoBusqueda: 'Ana', pagina: 0, ordenamiento: 'CALIFICACION' }).subscribe();
    const conTermino = httpMock.expectOne((r) => r.params.get('terminoBusqueda') === 'Ana');
    conTermino.flush({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 });

    service.listar({ terminoBusqueda: 'a', pagina: 0, ordenamiento: 'CALIFICACION' }).subscribe();
    const sinTermino = httpMock.expectOne((r) => !r.params.has('terminoBusqueda'));
    sinTermino.flush({ contenido: [], totalResultados: 0, paginaActual: 0, totalPaginas: 0 });
  });
});
