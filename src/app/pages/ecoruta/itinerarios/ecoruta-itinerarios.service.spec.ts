import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EcoRutaItinerariosService } from './ecoruta-itinerarios.service';
import { Itinerario } from './models/itinerario.model';
import { RefinamientoRequest, RefinamientoResponse } from './models/refinamiento.model';

describe('EcoRutaItinerariosService', () => {
  let service: EcoRutaItinerariosService;
  let httpMock: HttpTestingController;

  const itinerario: Itinerario = {
    id: '11111111-1111-1111-1111-111111111111',
    cantidadDias: 2,
    fechaInicio: '2026-09-01',
    tipoViaje: 'INDIVIDUAL',
    estado: 'GENERADO',
    version: 1,
    puntuacionAmbientalPreliminar: 85,
    ecoScore: 85,
    clasificacionAmbiental: 'EXCELENTE',
    ecoScoreParcial: false,
    ecoScoreCalculadoEn: '2026-07-30T20:38:19.896Z',
    fechaGeneracion: '2026-07-30T20:38:19.896Z',
    generadoParcial: false,
    mensajeParcial: null,
    dias: [],
    establecimientosEvaluados: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EcoRutaItinerariosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('generar hace POST a /ecoruta/itinerarios/generar', () => {
    let resultado: Itinerario | undefined;
    service.generar().subscribe((response) => (resultado = response));

    const req = httpMock.expectOne(`${EcoRutaItinerariosService.URL}/generar`);
    expect(req.request.method).toBe('POST');
    req.flush(itinerario);

    expect(resultado).toEqual(itinerario);
  });

  it('obtener hace GET a /ecoruta/itinerarios/{id}', () => {
    let resultado: Itinerario | undefined;
    service.obtener(itinerario.id).subscribe((response) => (resultado = response));

    const req = httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${itinerario.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(itinerario);

    expect(resultado).toEqual(itinerario);
  });

  it('refinar hace POST a /ecoruta/itinerarios/{id}/mensajes con el body correcto', () => {
    const request: RefinamientoRequest = {
      mensajeUsuario: 'Quiero más actividades al aire libre.',
      contextoConversacional: {
        itinerarioId: itinerario.id,
        historialMensajes: [],
        versionItinerario: 1,
      },
    };
    const respuesta: RefinamientoResponse = {
      itinerario,
      respuestaAsistente: 'Listo, agregué una caminata.',
      historialMensajes: [
        { rol: 'USUARIO', contenido: request.mensajeUsuario },
        { rol: 'ASISTENTE', contenido: 'Listo, agregué una caminata.' },
      ],
      actividadParaComparar: null,
    };

    let resultado: RefinamientoResponse | undefined;
    service.refinar(itinerario.id, request).subscribe((response) => (resultado = response));

    const req = httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${itinerario.id}/mensajes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(respuesta);

    expect(resultado).toEqual(respuesta);
  });

  it('listar envia pagina y filtro de favoritos cuando corresponde', () => {
    service.listar({ pagina: 2, soloFavoritos: true }).subscribe();

    const req = httpMock.expectOne(
      (request) =>
        request.url === EcoRutaItinerariosService.URL &&
        request.params.get('pagina') === '2' &&
        request.params.get('soloFavoritos') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      contenido: [],
      totalResultados: 0,
      paginaActual: 2,
      totalPaginas: 0,
      tamanioPagina: 12,
    });
  });

  it('actualizarFavorito hace PUT al endpoint de favorito con el body correcto', () => {
    let resultado: { id: string; favorito: boolean } | undefined;
    service.actualizarFavorito(itinerario.id, true).subscribe((response) => (resultado = response));

    const req = httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${itinerario.id}/favorito`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ favorito: true });
    req.flush({ id: itinerario.id, favorito: true });

    expect(resultado).toEqual({ id: itinerario.id, favorito: true });
  });

  it('eliminar hace DELETE a /ecoruta/itinerarios/{id}', () => {
    let completado = false;
    service.eliminar(itinerario.id).subscribe(() => (completado = true));

    const req = httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${itinerario.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completado).toBe(true);
  });

  it('eliminar propaga errores del backend', () => {
    let error: HttpErrorResponse | undefined;
    service.eliminar(itinerario.id).subscribe({ error: (err) => (error = err) });

    const req = httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${itinerario.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(
      { message: 'No tienes permiso para modificar este itinerario.' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(error?.status).toBe(403);
    expect(error?.error?.message).toBe('No tienes permiso para modificar este itinerario.');
  });
});
