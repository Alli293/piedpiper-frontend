import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../../core/auth-session.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { EcoRutaItinerariosService } from './ecoruta-itinerarios.service';
import { EcoRutaRecomendacionesService } from './ecoruta-recomendaciones.service';
import { Itinerario } from './models/itinerario.model';
import { ItinerarioGeneradoPageComponent } from './itinerario-generado-page.component';

const ITINERARIO_ID = '11111111-1111-1111-1111-111111111111';

const ITINERARIO_BASE: Itinerario = {
  id: ITINERARIO_ID,
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
  establecimientosEvaluados: [],
  dias: [
    {
      numeroDia: 2,
      fecha: '2026-09-02',
      actividades: [
        {
          nombre: 'Tarde libre',
          descripcion: null,
          horario: '14:00:00',
          duracionMinutos: 60,
          costoAproximado: null,
          moneda: null,
          establecimientoRecomendado: null,
          provincia: 'PUNTARENAS',
        },
      ],
    },
    {
      numeroDia: 1,
      fecha: '2026-09-01',
      actividades: [
        {
          nombre: 'Almuerzo',
          descripcion: 'Comida típica',
          horario: '12:00:00',
          duracionMinutos: 90,
          costoAproximado: 9,
          moneda: 'USD',
          establecimientoRecomendado: 'Soda La Amistad',
          provincia: 'PUNTARENAS',
        },
        {
          nombre: 'Caminata',
          descripcion: 'Senderismo guiado',
          horario: '08:00:00',
          duracionMinutos: 150,
          costoAproximado: 18,
          moneda: 'USD',
          establecimientoRecomendado: 'Reserva Selvatura',
          provincia: 'PUNTARENAS',
        },
      ],
    },
  ],
};

describe('ItinerarioGeneradoPageComponent', () => {
  let fixture: ComponentFixture<ItinerarioGeneradoPageComponent>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  async function crearFixture(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ItinerarioGeneradoPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: ITINERARIO_ID }) } },
        },
        {
          provide: AuthSessionService,
          useValue: { getUserInitials: () => 'MS', isAdministradorEmpresa: () => false },
        },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItinerarioGeneradoPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * `<app-recomendaciones-ambientales>` (PP-93) se activa apenas el itinerario carga con éxito y
   * dispara su propio GET; estos tests solo verifican el comportamiento de la página, así que la
   * petición se drena con una respuesta neutral (sin recomendaciones) en vez de aserirla acá.
   */
  function flushRecomendaciones(): void {
    httpMock
      .match(`${EcoRutaRecomendacionesService.URL}/${ITINERARIO_ID}/recomendaciones`)
      .forEach((req) => req.flush({ recomendaciones: [], mensaje: null }));
  }

  it('carga el itinerario, ordena dias y actividades, y muestra el EcoScore', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush(ITINERARIO_BASE);
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('85');
    expect(texto).toContain('Excelente');
    expect(texto).toContain('Caminata');
    expect(texto).toContain('Almuerzo');
    expect(texto).toContain('Tarde libre');

    // El título real del itinerario vive en el header, no en un heading duplicado en el body.
    expect(texto).toContain('Costa Rica sostenible · 2 días');

    // Escala de rangos: las 4 categorías se listan siempre, y solo la del itinerario
    // actual (Excelente, 85) queda resaltada.
    const raiz = fixture.nativeElement as HTMLElement;
    expect(texto).toContain('80–100');
    expect(texto).toContain('60–79');
    expect(texto).toContain('40–59');
    expect(texto).toContain('0–39');
    expect(
      raiz.querySelector('.ch-itinerario-generado__escala-item--excelente')?.classList
    ).toContain('is-activo');
    expect(
      raiz.querySelector('.ch-itinerario-generado__escala-item--buena')?.classList
    ).not.toContain('is-activo');

    const nombresActividades = Array.from(
      raiz.querySelectorAll('.ch-itinerario-generado__actividad-info strong')
    ).map((el) => el.textContent?.trim());
    // Dia 1 (Caminata 08:00 antes que Almuerzo 12:00) debe ir antes del dia 2 (Tarde libre),
    // aunque el backend los haya devuelto en otro orden.
    expect(nombresActividades).toEqual(['Caminata', 'Almuerzo', 'Tarde libre']);
  });

  it('muestra un banner inline cuando el itinerario quedo parcial', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush({
      ...ITINERARIO_BASE,
      generadoParcial: true,
      mensajeParcial:
        'Se generó un itinerario parcial porque no se encontraron suficientes actividades.',
    });
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('itinerario parcial');
  });

  it('muestra un banner inline cuando el EcoScore fue calculado con informacion parcial', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush({
      ...ITINERARIO_BASE,
      ecoScoreParcial: true,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'El EcoScore fue calculado con información parcial'
    );
  });

  it('muestra un toast de error cuando no fue posible calcular el EcoScore', async () => {
    await crearFixture();
    const errorSpy = vi.spyOn(toastService, 'error');

    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush({
      ...ITINERARIO_BASE,
      ecoScore: null,
      clasificacionAmbiental: null,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    expect(errorSpy).toHaveBeenCalledWith(
      'No fue posible calcular el impacto ambiental del itinerario.',
      undefined,
      5000
    );
  });

  it('muestra el desglose ambiental por establecimiento', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush({
      ...ITINERARIO_BASE,
      establecimientosEvaluados: [
        {
          nombreEstablecimiento: 'Reserva Selvatura',
          puntuacionAmbiental: {
            puntuacionTotal: 68,
            componenteCertificaciones: 30,
            componenteIma: 24,
            componenteBenchmark: 14,
            cantidadCertificacionesActivas: 3,
            estimado: false,
          },
        },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Desglose por establecimiento');
    expect(texto).toContain('Reserva Selvatura');
  });

  it('no revienta y omite el desglose cuando el backend envia establecimientosEvaluados null', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush({
      ...ITINERARIO_BASE,
      establecimientosEvaluados: null,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('Desglose por establecimiento');
    expect(fixture.nativeElement.textContent).toContain('85');
  });

  it('muestra estado de error y permite reintentar si la carga falla', async () => {
    await crearFixture();
    const errorSpy = vi.spyOn(toastService, 'error');

    httpMock
      .expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`)
      .flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el itinerario.');
    expect(errorSpy).toHaveBeenCalled();

    // Scoped al contenedor de error: el sidebar de app-shell-layout también renderiza botones.
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.ch-itinerario-generado__estado button')
      ?.click();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush(ITINERARIO_BASE);
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Excelente');
  });

  it('muestra un toast de acceso denegado cuando el itinerario es de otro usuario (403)', async () => {
    await crearFixture();
    const errorSpy = vi.spyOn(toastService, 'error');

    httpMock
      .expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`)
      .flush({}, { status: 403, statusText: 'Forbidden' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalledWith(
      'No tienes permiso para acceder a este itinerario.',
      undefined,
      5000
    );
    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el itinerario.');
  });

  it('colapsa y expande las actividades de un día al hacer click en su encabezado', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush(ITINERARIO_BASE);
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const headerDia1 = root.querySelectorAll<HTMLButtonElement>(
      '.ch-itinerario-generado__dia-header'
    )[0];

    expect(root.querySelectorAll('.ch-itinerario-generado__actividades').length).toBe(2);
    expect(headerDia1.getAttribute('aria-expanded')).toBe('true');

    headerDia1.click();
    fixture.detectChanges();

    expect(root.querySelectorAll('.ch-itinerario-generado__actividades').length).toBe(1);
    expect(headerDia1.getAttribute('aria-expanded')).toBe('false');

    headerDia1.click();
    fixture.detectChanges();

    expect(root.querySelectorAll('.ch-itinerario-generado__actividades').length).toBe(2);
  });

  it('el boton "Preguntar sobre esto" hace scroll hacia el panel de chat', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush(ITINERARIO_BASE);
    await fixture.whenStable();
    fixture.detectChanges();
    flushRecomendaciones();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const panel = root.querySelector<HTMLElement>('.ch-itinerario-generado__lateral')!;
    // jsdom no implementa scrollIntoView de forma nativa: se stubea directo en vez
    // de vi.spyOn, que requiere que el método ya exista en el prototype.
    const scrollSpy = vi.fn();
    panel.scrollIntoView = scrollSpy;

    const botones = Array.from(root.querySelectorAll('button'));
    const preguntar = botones.find((boton) => boton.textContent?.includes('Preguntar sobre esto'));
    preguntar?.click();

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
