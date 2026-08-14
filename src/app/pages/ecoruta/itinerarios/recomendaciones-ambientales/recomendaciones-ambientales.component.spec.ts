import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../../../../shared/services/toast.service';
import { EcoRutaRecomendacionesService } from '../ecoruta-recomendaciones.service';
import { Itinerario } from '../models/itinerario.model';
import { RecomendacionAmbiental, RecomendacionesResponse } from '../models/recomendaciones.model';
import { RecomendacionesAmbientalesComponent } from './recomendaciones-ambientales.component';

const ITINERARIO_ID = '11111111-1111-1111-1111-111111111111';
const ACTIVIDAD_ID = '22222222-2222-2222-2222-222222222222';
const OTRA_ACTIVIDAD_ID = '33333333-3333-3333-3333-333333333333';

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

const OTRA_RECOMENDACION_MOCK: RecomendacionAmbiental = {
  ...RECOMENDACION_MOCK,
  actividadId: OTRA_ACTIVIDAD_ID,
  actividadNombre: 'Paseo en bote',
  descripcion: 'Sustituye "Paseo en bote" por "Kayak sostenible".',
  incrementoEstimado: 3.2,
};

const RECOMENDACION_SIN_CATEGORIA_MOCK: RecomendacionAmbiental = {
  ...RECOMENDACION_MOCK,
  categoriaTuristica: null,
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

  function flushRecomendaciones(
    response: RecomendacionesResponse,
    itinerarioId = ITINERARIO_ID
  ): void {
    const req = httpMock.expectOne(
      `${EcoRutaRecomendacionesService.URL}/${itinerarioId}/recomendaciones`
    );
    expect(req.request.method).toBe('GET');
    req.flush(response);
  }

  afterEach(() => {
    httpMock.verify();
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

      flushRecomendaciones({
        recomendaciones: [],
        mensaje: 'Tu itinerario ya presenta un excelente desempeño ambiental.',
      });
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

    it('muestra un texto de respaldo si el backend manda lista vacía sin mensaje', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushRecomendaciones({ recomendaciones: [], mensaje: null });
      await fixture.whenStable();
      fixture.detectChanges();

      const optimizado = fixture.nativeElement.querySelector('.ch-recomendaciones__optimizado');
      expect(optimizado).not.toBeNull();
      expect(optimizado.textContent?.trim()).not.toBe('');
    });
  });

  describe('recomendación no aplicable por datos incompletos', () => {
    it('no muestra el botón Aplicar cuando falta categoriaTuristica', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushRecomendaciones({ recomendaciones: [RECOMENDACION_SIN_CATEGORIA_MOCK], mensaje: null });
      await fixture.whenStable();
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.ch-recomendaciones__item');
      expect(items.length).toBe(1);
      expect(items[0].querySelector('.ch-recomendaciones__boton-aplicar')).toBeNull();
    });

    it('muestra un toast de error si aplicar() se invoca igual con datos incompletos', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);
      const toastService = TestBed.inject(ToastService);
      const errorSpy = vi.spyOn(toastService, 'error');

      fixture.detectChanges();
      flushRecomendaciones({ recomendaciones: [RECOMENDACION_SIN_CATEGORIA_MOCK], mensaje: null });
      await fixture.whenStable();
      fixture.detectChanges();

      // Defensa en profundidad: aunque el template no muestre el botón, aplicar() nunca debe
      // fallar en silencio si algo lo invoca igual con datos incompletos.
      (
        fixture.componentInstance as unknown as {
          aplicar: (r: RecomendacionAmbiental) => void;
        }
      ).aplicar(RECOMENDACION_SIN_CATEGORIA_MOCK);

      expect(errorSpy).toHaveBeenCalled();
      httpMock.expectNone(
        `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones/${ACTIVIDAD_ID}/aplicar`
      );
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

    it('trackea el estado de "aplicando" por fila: aplicar A no afecta el botón de B', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      flushRecomendaciones({
        recomendaciones: [RECOMENDACION_MOCK, OTRA_RECOMENDACION_MOCK],
        mensaje: null,
      });
      await fixture.whenStable();
      fixture.detectChanges();

      const botones = fixture.nativeElement.querySelectorAll('.ch-recomendaciones__boton-aplicar');
      expect(botones.length).toBe(2);

      // Click en la primera recomendación (A) — su request queda en vuelo.
      botones[0].click();
      fixture.detectChanges();

      const botonesTrasClickA = fixture.nativeElement.querySelectorAll(
        '.ch-recomendaciones__boton-aplicar'
      );
      expect(botonesTrasClickA[0].disabled).toBe(true);
      expect(botonesTrasClickA[0].textContent).toContain('Aplicando...');
      // B no debería verse afectado por la request en vuelo de A.
      expect(botonesTrasClickA[1].disabled).toBe(false);
      expect(botonesTrasClickA[1].textContent).toContain('Aplicar');

      // Click en B mientras A sigue pendiente: ambas requests en vuelo simultáneamente.
      botonesTrasClickA[1].click();
      fixture.detectChanges();

      const putReqA = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones/${ACTIVIDAD_ID}/aplicar`
      );
      const putReqB = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones/${OTRA_ACTIVIDAD_ID}/aplicar`
      );

      // B resuelve primero: A debe seguir marcada como "aplicando", no debe pisarse el estado.
      putReqB.flush({ ...ITINERARIO_ACTUALIZADO_MOCK });
      fixture.detectChanges();

      const botonATrasResolverB = fixture.nativeElement.querySelector(
        '.ch-recomendaciones__boton-aplicar'
      );
      expect(botonATrasResolverB.disabled).toBe(true);
      expect(botonATrasResolverB.textContent).toContain('Aplicando...');

      putReqA.flush({ ...ITINERARIO_ACTUALIZADO_MOCK });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('.ch-recomendaciones__item').length).toBe(0);
    });
  });

  describe('carga obsoleta descartada', () => {
    it('descarta la respuesta de un itinerarioId anterior si cambia mientras la petición está en vuelo', async () => {
      fixture = await crearFixture();
      httpMock = TestBed.inject(HttpTestingController);

      fixture.detectChanges();
      const primeraReq = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones`
      );

      const OTRO_ITINERARIO_ID = '99999999-9999-9999-9999-999999999999';
      fixture.componentRef.setInput('itinerarioId', OTRO_ITINERARIO_ID);
      fixture.detectChanges();
      const segundaReq = httpMock.expectOne(
        `${EcoRutaRecomendacionesService.URL}/${OTRO_ITINERARIO_ID}/recomendaciones`
      );

      // La primera petición (obsoleta) resuelve después que la segunda.
      segundaReq.flush({ recomendaciones: [OTRA_RECOMENDACION_MOCK], mensaje: null });
      await fixture.whenStable();
      primeraReq.flush({ recomendaciones: [RECOMENDACION_MOCK], mensaje: null });
      await fixture.whenStable();
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll('.ch-recomendaciones__item');
      expect(items.length).toBe(1);
      expect(items[0].textContent).toContain('Paseo en bote');
    });
  });

  describe('errores', () => {
    it('muestra un estado de error inline persistente cuando la carga inicial falla con 403', async () => {
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

      const errorInline = fixture.nativeElement.querySelector('.ch-recomendaciones__error');
      expect(errorInline).not.toBeNull();
      expect(errorInline.getAttribute('role')).toBe('alert');
      expect(errorInline.textContent).toContain(
        'No tienes permiso para acceder a este itinerario.'
      );
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
      // Y el botón vuelve a estar habilitado (no queda "Aplicando..." colgado).
      const boton = fixture.nativeElement.querySelector('.ch-recomendaciones__boton-aplicar');
      expect(boton.disabled).toBe(false);
    });
  });
});
