import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { MetasService } from './metas.service';

describe('MetasService', () => {
  let service: MetasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MetasService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MetasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('hace POST a /metas con el cuerpo correcto', () => {
    service
      .crearMeta({
        nombreMeta: 'Reducir huella total',
        valorObjetivoHuellaT: 50,
        fechaLimite: '2027-12-31',
      })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/metas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nombreMeta: 'Reducir huella total',
      valorObjetivoHuellaT: 50,
      fechaLimite: '2027-12-31',
    });

    req.flush({
      id: 'm1',
      nombreMeta: 'Reducir huella total',
      valorObjetivoHuellaT: 50,
      fechaLimite: '2027-12-31',
      huellaActualT: 30,
      progresoPorcentaje: 60,
      vencida: false,
      fechaCreacion: '2026-08-06T00:00:00Z',
    });
  });

  it('hace GET a /metas con periodo y anio como query params', () => {
    service.listarMetas('trimestre', 2026).subscribe((metas) => {
      expect(metas[0].progresoPorcentaje).toBe(60);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/metas?periodo=trimestre&anio=2026`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('periodo')).toBe('trimestre');
    expect(req.request.params.get('anio')).toBe('2026');

    req.flush([
      {
        id: 'm1',
        nombreMeta: 'Reducir huella total',
        valorObjetivoHuellaT: 50,
        fechaLimite: '2027-12-31',
        huellaActualT: 30,
        progresoPorcentaje: 60,
        vencida: false,
        fechaCreacion: '2026-08-06T00:00:00Z',
      },
    ]);
  });

  it('hace GET a /metas sin query params cuando no se indica periodo ni anio', () => {
    service.listarMetas().subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/metas`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);

    req.flush([]);
  });
});
