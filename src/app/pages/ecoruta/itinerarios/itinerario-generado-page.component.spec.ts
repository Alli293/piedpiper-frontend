import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from '../../../core/auth-session.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { ToastService } from '../../../shared/services/toast.service';
import { EcoRutaItinerariosService } from './ecoruta-itinerarios.service';
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

  it('carga el itinerario, ordena dias y actividades, y muestra el EcoScore', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush(ITINERARIO_BASE);
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('85');
    expect(texto).toContain('Excelente');
    expect(texto).toContain('Caminata');
    expect(texto).toContain('Almuerzo');
    expect(texto).toContain('Tarde libre');

    const nombresActividades = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.ch-itinerario-generado__actividad-info strong'
      )
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

    expect(fixture.nativeElement.textContent).toContain('Excelente');
  });

  it('el boton "Volver a mis itinerarios" navega a /ecoruta/itinerarios', async () => {
    await crearFixture();
    httpMock.expectOne(`${EcoRutaItinerariosService.URL}/${ITINERARIO_ID}`).flush(ITINERARIO_BASE);
    await fixture.whenStable();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const botones = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    const volver = botones.find((boton) => boton.textContent?.includes('Volver a mis itinerarios'));
    volver?.click();

    expect(navigateSpy).toHaveBeenCalledWith('/ecoruta/itinerarios');
  });
});
