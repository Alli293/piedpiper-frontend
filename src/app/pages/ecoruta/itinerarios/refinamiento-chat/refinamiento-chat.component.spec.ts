import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { RefinamientoChatComponent } from './refinamiento-chat.component';
import { Itinerario } from '../models/itinerario.model';
import { EcoRutaAlternativasService } from '../ecoruta-alternativas.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ComparacionResponse } from '../models/alternativas.model';

describe('RefinamientoChatComponent', () => {
  let fixture: ComponentFixture<RefinamientoChatComponent>;

  const itinerario: Itinerario = {
    id: '1',
    cantidadDias: 3,
    fechaInicio: '2026-09-01',
    tipoViaje: 'INDIVIDUAL',
    estado: 'GENERADO',
    version: 1,
    puntuacionAmbientalPreliminar: 82,
    ecoScore: 82,
    clasificacionAmbiental: 'BUENA',
    ecoScoreParcial: false,
    ecoScoreCalculadoEn: '2026-07-30T20:00:00Z',
    fechaGeneracion: '2026-07-30T20:00:00Z',
    generadoParcial: false,
    mensajeParcial: null,
    dias: [],
    establecimientosEvaluados: [],
  };

  async function crearFixture(input: Itinerario) {
    await TestBed.configureTestingModule({
      imports: [RefinamientoChatComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(RefinamientoChatComponent);
    fixture.componentRef.setInput('itinerario', input);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el mensaje inicial con la cantidad de dias y el EcoScore', async () => {
    fixture = await crearFixture(itinerario);

    expect(fixture.nativeElement.textContent).toContain('3 días');
    expect(fixture.nativeElement.textContent).toContain('EcoScore de 82');
  });

  it('usa singular cuando el itinerario es de un solo dia', async () => {
    fixture = await crearFixture({ ...itinerario, cantidadDias: 1 });

    expect(fixture.nativeElement.textContent).toContain('1 día');
    expect(fixture.nativeElement.textContent).not.toContain('1 días');
  });

  it('omite el EcoScore del mensaje cuando es nulo', async () => {
    fixture = await crearFixture({ ...itinerario, ecoScore: null });

    // El encabezado del panel ("...recalculá tu EcoScore") sí menciona "EcoScore" siempre;
    // lo que se valida acá es que el MENSAJE del asistente en particular lo omita.
    const mensaje = (fixture.nativeElement as HTMLElement).querySelector(
      '.ch-refinamiento-chat__mensaje p'
    );
    expect(mensaje?.textContent).not.toContain('EcoScore');
    expect(mensaje?.textContent).toContain('está listo. ¿Querés ajustar algo?');
  });

  it('el input y el boton de enviar estan deshabilitados', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('input')?.disabled).toBe(true);
    expect(root.querySelector('button')?.disabled).toBe(true);
    expect(root.textContent).toContain('Disponible próximamente');
  });
});

describe('RefinamientoChatComponent — integración con alternativas', () => {
  let fixture: ComponentFixture<RefinamientoChatComponent>;
  let alternativasService: {
    obtenerAlternativas: ReturnType<typeof vi.fn>;
    sustituirActividad: ReturnType<typeof vi.fn>;
  };
  let toastService: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };

  const itinerarioConActividades: Itinerario = {
    id: 'itin-1',
    cantidadDias: 2,
    fechaInicio: '2026-09-01',
    tipoViaje: 'INDIVIDUAL',
    estado: 'GENERADO',
    version: 1,
    puntuacionAmbientalPreliminar: 75,
    fechaGeneracion: '2026-07-30T20:00:00Z',
    generadoParcial: false,
    mensajeParcial: null,
    dias: [
      {
        numeroDia: 1,
        fecha: '2026-09-01',
        actividades: [
          {
            id: 'act-1',
            nombre: 'Visita al volcán',
            descripcion: 'Tour al cráter',
            horario: '08:00',
            duracionMinutos: 180,
            costoAproximado: 15000,
            moneda: 'CRC',
            establecimientoRecomendado: 'Parque Nacional',
            provincia: 'Alajuela',
            puntuacionAmbientalEstimada: 60,
          },
        ],
      },
      {
        numeroDia: 2,
        fecha: '2026-09-02',
        actividades: [
          {
            id: 'act-2',
            nombre: 'Snorkel en playa',
            descripcion: 'Exploración marina',
            horario: '10:00',
            duracionMinutos: 120,
            costoAproximado: 25000,
            moneda: 'CRC',
            establecimientoRecomendado: 'Centro de Buceo',
            provincia: 'Guanacaste',
            puntuacionAmbientalEstimada: 45,
          },
        ],
      },
    ],
  };

  const comparacionExitosa: ComparacionResponse = {
    actividadOriginalNombre: 'Visita al volcán',
    ecoScoreOriginal: 60,
    categoriaTuristica: 'NATURALEZA',
    provincia: 'Alajuela',
    alternativas: [
      {
        nombre: 'Caminata ecológica',
        descripcion: 'Sendero interpretativo',
        ecoScore: 90,
        costoAproximado: 8000,
        moneda: 'CRC',
        establecimientoRecomendado: 'Reserva Biológica',
        diferenciaAmbiental: 30,
        mejorDesempeno: true,
      },
      {
        nombre: 'Avistamiento de aves',
        descripcion: 'Tour ornitológico',
        ecoScore: 80,
        costoAproximado: 12000,
        moneda: 'CRC',
        establecimientoRecomendado: 'Finca Eco',
        diferenciaAmbiental: 20,
        mejorDesempeno: false,
      },
    ],
    mensaje: null,
  };

  async function setup() {
    alternativasService = {
      obtenerAlternativas: vi.fn(),
      sustituirActividad: vi.fn(),
    };
    toastService = {
      info: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RefinamientoChatComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EcoRutaAlternativasService, useValue: alternativasService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RefinamientoChatComponent);
    fixture.componentRef.setInput('itinerario', itinerarioConActividades);
    fixture.detectChanges();
  }

  function clickCompararAlternativas(): void {
    const btnComparar = (fixture.nativeElement as HTMLElement).querySelector(
      '.ch-refinamiento-chat__btn-comparar'
    ) as HTMLButtonElement;
    btnComparar.click();
    fixture.detectChanges();
  }

  describe('aparición de tarjetas tras respuesta exitosa', () => {
    it('muestra app-alternativas-comparacion en el DOM tras respuesta exitosa', async () => {
      await setup();
      alternativasService.obtenerAlternativas.mockReturnValue(of(comparacionExitosa));

      clickCompararAlternativas();

      const tarjetas = (fixture.nativeElement as HTMLElement).querySelector(
        'app-alternativas-comparacion'
      );
      expect(tarjetas).not.toBeNull();
    });

    it('no muestra app-alternativas-comparacion antes de solicitar alternativas', async () => {
      await setup();

      const tarjetas = (fixture.nativeElement as HTMLElement).querySelector(
        'app-alternativas-comparacion'
      );
      expect(tarjetas).toBeNull();
    });
  });

  describe('toast con mensaje correcto para cada tipo de error', () => {
    it('muestra toast info cuando la respuesta tiene alternativas vacías con mensaje', async () => {
      await setup();
      const respuestaVacia: ComparacionResponse = {
        ...comparacionExitosa,
        alternativas: [],
        mensaje: 'No existen alternativas disponibles para esta actividad.',
      };
      alternativasService.obtenerAlternativas.mockReturnValue(of(respuestaVacia));

      clickCompararAlternativas();

      expect(toastService.info).toHaveBeenCalledWith(
        'No existen alternativas disponibles para esta actividad.',
        undefined,
        5000
      );
    });

    it('muestra toast error con mensaje de permiso cuando ocurre HTTP 403', async () => {
      await setup();
      const error403 = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
      alternativasService.obtenerAlternativas.mockReturnValue(throwError(() => error403));

      clickCompararAlternativas();

      expect(toastService.error).toHaveBeenCalledWith(
        'No tienes permiso para acceder a este itinerario.',
        undefined,
        5000
      );
    });

    it('muestra toast error genérico cuando ocurre HTTP 5xx', async () => {
      await setup();
      const error500 = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
      alternativasService.obtenerAlternativas.mockReturnValue(throwError(() => error500));

      clickCompararAlternativas();

      expect(toastService.error).toHaveBeenCalledWith(
        'No fue posible generar la comparación solicitada.',
        undefined,
        5000
      );
    });

    it('muestra toast error y NO limpia comparacionResponse cuando sustitución falla', async () => {
      await setup();
      alternativasService.obtenerAlternativas.mockReturnValue(of(comparacionExitosa));
      clickCompararAlternativas();

      // Now simulate substitution error
      const errorSustitucion = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      alternativasService.sustituirActividad.mockReturnValue(throwError(() => errorSustitucion));

      // Trigger onReemplazar via the component's internal method
      (fixture.componentInstance as any).onReemplazar(comparacionExitosa.alternativas[0]);
      fixture.detectChanges();

      expect(toastService.error).toHaveBeenCalledWith(
        'No fue posible realizar la sustitución. Intenta nuevamente.',
        undefined,
        5000
      );
      // comparacionResponse should still be present (cards still visible)
      const tarjetas = (fixture.nativeElement as HTMLElement).querySelector(
        'app-alternativas-comparacion'
      );
      expect(tarjetas).not.toBeNull();
    });
  });

  describe('actualización de itinerario tras sustitución exitosa', () => {
    it('muestra toast success y limpia las tarjetas tras sustitución exitosa', async () => {
      await setup();
      alternativasService.obtenerAlternativas.mockReturnValue(of(comparacionExitosa));
      clickCompararAlternativas();

      // Simulate successful substitution
      const itinerarioActualizado: Itinerario = {
        ...itinerarioConActividades,
        dias: [
          {
            ...itinerarioConActividades.dias[0],
            actividades: [
              {
                id: 'act-1',
                nombre: 'Caminata ecológica',
                descripcion: 'Sendero interpretativo',
                horario: '08:00',
                duracionMinutos: 180,
                costoAproximado: 8000,
                moneda: 'CRC',
                establecimientoRecomendado: 'Reserva Biológica',
                provincia: 'Alajuela',
                puntuacionAmbientalEstimada: 90,
              },
            ],
          },
          itinerarioConActividades.dias[1],
        ],
      };
      alternativasService.sustituirActividad.mockReturnValue(of(itinerarioActualizado));

      (fixture.componentInstance as any).onReemplazar(comparacionExitosa.alternativas[0]);
      fixture.detectChanges();

      expect(toastService.success).toHaveBeenCalledWith(
        'Actividad reemplazada exitosamente.',
        undefined,
        5000
      );
      // After successful substitution, comparacionResponse is cleared (cards disappear)
      const tarjetas = (fixture.nativeElement as HTMLElement).querySelector(
        'app-alternativas-comparacion'
      );
      expect(tarjetas).toBeNull();
    });
  });
});
