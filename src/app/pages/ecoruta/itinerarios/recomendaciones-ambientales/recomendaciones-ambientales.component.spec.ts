import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EcoRutaRecomendacionesService } from '../ecoruta-recomendaciones.service';
import { Itinerario } from '../models/itinerario.model';
import { RecomendacionAmbiental, RecomendacionesResponse } from '../models/recomendaciones.model';
import { RecomendacionesAmbientalesComponent } from './recomendaciones-ambientales.component';

const ITINERARIO_ID = '11111111-1111-1111-1111-111111111111';
const ACTIVIDAD_ID = '22222222-2222-2222-2222-222222222222';

const RECOMENDACION_MOCK: RecomendacionAmbiental = {
  tipo: 'ACTIVIDAD_ALTERNATIVA',
  actividadId: ACTIVIDAD_ID,
  actividadNombre: 'Canopy en Monteverde',
  descripcion: 'Sustituye "Canopy en Monteverde" por "Senderismo en Reserva Biológica".',
  incrementoEstimado: 5.5,
  alternativa: {
    nombre: 'Senderismo en Reserva Biológica',
    descripcion: 'Caminata guiada por bosque primario',
    ecoScore: 85,
    costoAproximado: 15000,
    moneda: 'CRC',
    establecimientoRecomendado: 'Reserva Monteverde',
    diferenciaAmbiental: 20,
    mejorDesempeno: true,
  },
  categoriaTuristica: 'AVENTURA',
  provincia: 'PUNTARENAS',
};

const ITINERARIO_ACTUALIZADO_MOCK: Itinerario = {
  id: ITINERARIO_ID,
  cantidadDias: 2,
  fechaInicio: '2026-09-01',
  tipoViaje: 'INDIVIDUAL',
  estado: 'GENERADO',
  version: 2,
  puntuacionAmbientalPreliminar: 90,
  ecoScore: 91,
  clasificacionAmbiental: 'EXCELENTE',
  ecoScoreParcial: false,
  ecoScoreCalculadoEn: '2026-07-30T20:38:19.896Z',
  fechaGeneracion: '2026-07-30T20:38:19.896Z',
  generadoParcial: false,
  mensajeParcial: null,
  dias: [],
  establecimientosEvaluados: [],
};

describe('RecomendacionesAmbientalesComponent', () => {
  let fixture: ComponentFixture<RecomendacionesAmbientalesComponent>;
  let httpMock: HttpTestingController;

  async function crearFixture(): Promise<ComponentFixture<RecomendacionesAmbientalesComponent>> {
    await TestBed.configureTestingModule({
      imports: [RecomendacionesAmbientalesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const created = TestBed.createComponent(RecomendacionesAmbientalesComponent);
    created.componentRef.setInput('itinerarioId', ITINERARIO_ID);
    return created;
  }

  function flushRecomendaciones(response: RecomendacionesResponse): void {
    const req = httpMock.expectOne(
      `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones`
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);
  }

  afterEach(() => {
    httpMock?.verify();
  });

  describe('visualización de la lista de recomendaciones', () => {
    it('muestra la lista con la descripción y el incremento estimado', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushRecomendaciones({ recomendaciones: [RECOMENDACION_MOCK], mensaje: null });
      await fixture.whenStable();
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.ch-recomendaciones__item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain(
        'Sustituye "Canopy en Monteverde" por "Senderismo en Reserva Biológica".'
      );
      expect(items[0].textContent).toContain('5.5');
    });

    it('muestra el estado de carga mientras espera la respuesta', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();

      const cargando = fixture.nativeElement.querySelector('.ch-recomendaciones__cargando');
      expect(cargando).not.toBeNull();

      flushRecomendaciones({ recomendaciones: [], mensaje: 'Tu itinerario ya presenta un excelente desempeño ambiental.' });
      await fixture.whenStable();
    });
  });

  describe('texto de itinerario optimizado', () => {
    it('muestra el mensaje informativo cuando no hay recomendaciones', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushRecomendaciones({
        recomendaciones: [],
        mensaje: 'Tu itinerario ya presenta un excelente desempeño ambiental.',
      });
      await fixture.whenStable();
      fixture.detectChanges();

      const optimizado = fixture.nativeElement.querySelector('.ch-recomendaciones__optimizado');
      expect(optimizado).not.toBeNull();
      expect(optimizado.textContent).toContain(
        'Tu itinerario ya presenta un excelente desempeño ambiental.'
      );
      expect(fixture.nativeElement.querySelectorAll('.ch-recomendaciones__item').length).toBe(0);
    });

    it('muestra el mensaje neutro del backend cuando el itinerario no está en la banda excelente', async () => {
      // El componente no decide el texto: solo renderiza lo que el backend envía en `mensaje`.
      // Esto cubre la regresión donde se mostraba "excelente desempeño" con un EcoScore Moderado.
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushRecomendaciones({
        recomendaciones: [],
        mensaje:
          'No encontramos actividades específicas que sustituir para mejorar tu EcoScore en este momento.',
      });
      await fixture.whenStable();
      fixture.detectChanges();

      const optimizado = fixture.nativeElement.querySelector('.ch-recomendaciones__optimizado');
      expect(optimizado).not.toBeNull();
      expect(optimizado.textContent).toContain(
        'No encontramos actividades específicas que sustituir para mejorar tu EcoScore en este momento.'
      );
      expect(optimizado.textContent).not.toContain('excelente desempeño ambiental');
    });
  });

  describe('acción de aplicar recomendación', () => {
    it('llama al servicio con el body correcto y emite el itinerario actualizado', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      let itinerarioEmitido: Itinerario | undefined;
      fixture.componentInstance.itinerarioActualizado.subscribe((it) => (itinerarioEmitido = it));

      fixture.detectChanges();
      flushRecomendaciones({ recomendaciones: [RECOMENDACION_MOCK], mensaje: null });
      await fixture.whenStable();
      fixture.detectChanges();

      const boton = fixture.nativeElement.querySelector('.ch-recomendaciones__boton-aplicar');
      boton.click();

      const putReq = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones/${ACTIVIDAD_ID}/aplicar`
      );
      expect(putReq.request.method).toBe('PUT');
      expect(putReq.request.body).toEqual({
        nombre: 'Senderismo en Reserva Biológica',
        descripcion: 'Caminata guiada por bosque primario',
        costoAproximado: 15000,
        moneda: 'CRC',
        establecimientoRecomendado: 'Reserva Monteverde',
        ecoScore: 85,
        categoriaTuristica: 'AVENTURA',
        provincia: 'PUNTARENAS',
      });
      putReq.flush(ITINERARIO_ACTUALIZADO_MOCK);

      expect(itinerarioEmitido).toEqual(ITINERARIO_ACTUALIZADO_MOCK);
    });

    it('quita la recomendación aplicada de la lista', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushRecomendaciones({ recomendaciones: [RECOMENDACION_MOCK], mensaje: null });
      await fixture.whenStable();
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.ch-recomendaciones__boton-aplicar').click();

      const putReq = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones/${ACTIVIDAD_ID}/aplicar`
      );
      putReq.flush(ITINERARIO_ACTUALIZADO_MOCK);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.ch-recomendaciones__item').length).toBe(0);
    });
  });

  describe('toast de error', () => {
    it('no muestra recomendaciones cuando la carga inicial falla con 403', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();

      const req = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones`
      );
      req.flush(
        { message: 'No tienes permiso para acceder a este itinerario.' },
        { status: 403, statusText: 'Forbidden' }
      );
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.ch-recomendaciones__item').length).toBe(0);
      expect(fixture.nativeElement.querySelector('.ch-recomendaciones__optimizado')).toBeNull();
    });

    it('no falla cuando aplicar una recomendación devuelve error', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushRecomendaciones({ recomendaciones: [RECOMENDACION_MOCK], mensaje: null });
      await fixture.whenStable();
      fixture.detectChanges();

      fixture.nativeElement.querySelector('.ch-recomendaciones__boton-aplicar').click();

      const putReq = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones/${ACTIVIDAD_ID}/aplicar`
      );
      putReq.flush(
        { message: 'No fue posible aplicar la recomendación.' },
        { status: 500, statusText: 'Internal Server Error' }
      );
      fixture.detectChanges();

      // La recomendación sigue en la lista: no se remueve si la aplicación falló.
      expect(fixture.nativeElement.querySelectorAll('.ch-recomendaciones__item').length).toBe(1);
    });
  });
});
