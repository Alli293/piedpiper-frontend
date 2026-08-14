import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { RefinamientoChatComponent } from './refinamiento-chat.component';
import { Itinerario } from '../models/itinerario.model';
import { EcoRutaAlternativasService } from '../ecoruta-alternativas.service';
import { EcoRutaItinerariosService } from '../ecoruta-itinerarios.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ComparacionResponse } from '../models/alternativas.model';
import { RefinamientoResponse } from '../models/refinamiento.model';

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
    favorito: false,
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

  it('omite el EcoScore del mensaje cuando el campo está ausente (undefined)', async () => {
    const { ecoScore, ...sinEcoScore } = itinerario;
    fixture = await crearFixture(sinEcoScore as Itinerario);

    const mensaje = (fixture.nativeElement as HTMLElement).querySelector(
      '.ch-refinamiento-chat__mensaje p'
    );
    expect(mensaje?.textContent).not.toContain('EcoScore');
    expect(mensaje?.textContent).toContain('está listo. ¿Querés ajustar algo?');
  });

  it('el input esta habilitado y el boton de enviar arranca deshabilitado por estar vacio', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('input')?.disabled).toBe(false);
    expect(root.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('bloquea el input y el boton mientras sustituye una actividad', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.prellenarMensaje('Quiero ajustar el itinerario.');
    fixture.detectChanges();
    expect(root.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(false);

    (fixture.componentInstance as any).cargandoSustitucion.set(true);
    fixture.detectChanges();

    expect(root.querySelector('input')?.disabled).toBe(true);
    expect(root.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('muestra chips de sugerencia antes del primer mensaje del usuario', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    const chips = root.querySelectorAll('.ch-refinamiento-chat__chip');
    expect(chips.length).toBeGreaterThan(0);
    expect(chips[0].textContent).toContain('Quiero más actividades al aire libre.');
  });

  it('un chip precarga el mensaje en el input sin enviarlo', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    const chip = root.querySelector<HTMLButtonElement>('.ch-refinamiento-chat__chip');
    chip!.click();
    fixture.detectChanges();

    const input = root.querySelector<HTMLInputElement>('input')!;
    expect(input.value).toBe('Quiero más actividades al aire libre.');
  });

  it('prellenarMensaje() setea el input y le da foco (usado por "Preguntar sobre esto")', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.prellenarMensaje('¿Qué opciones tengo para "Canopy"?');
    fixture.detectChanges();

    const input = root.querySelector<HTMLInputElement>('input')!;
    expect(input.value).toBe('¿Qué opciones tengo para "Canopy"?');
    expect(document.activeElement).toBe(input);
  });

  it('el input tiene maxlength de 1000 (mismo tope que el backend)', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    const input = root.querySelector<HTMLInputElement>('input')!;
    expect(input.maxLength).toBe(1000);
  });

  it('un mensaje de más de 1000 caracteres deja el formulario invalido y el boton deshabilitado', async () => {
    fixture = await crearFixture(itinerario);
    const root = fixture.nativeElement as HTMLElement;

    const input = root.querySelector<HTMLInputElement>('input')!;
    input.value = 'a'.repeat(1001);
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(root.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBe(true);
  });

  it('el mensaje inicial no cambia retroactivamente si el itinerario de entrada se actualiza', async () => {
    fixture = await crearFixture(itinerario);
    fixture.componentRef.setInput('itinerario', { ...itinerario, ecoScore: 95 });
    fixture.detectChanges();

    const mensaje = (fixture.nativeElement as HTMLElement).querySelector(
      '.ch-refinamiento-chat__mensaje p'
    );
    expect(mensaje?.textContent).toContain('EcoScore de 82');
    expect(mensaje?.textContent).not.toContain('EcoScore de 95');
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
    ecoScore: 75,
    clasificacionAmbiental: 'BUENA',
    ecoScoreParcial: false,
    ecoScoreCalculadoEn: '2026-07-30T20:00:00Z',
    favorito: false,
    fechaGeneracion: '2026-07-30T20:00:00Z',
    generadoParcial: false,
    mensajeParcial: null,
    establecimientosEvaluados: [],
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

describe('RefinamientoChatComponent — conversación libre (PP-88)', () => {
  let fixture: ComponentFixture<RefinamientoChatComponent>;
  let itinerariosService: { refinar: ReturnType<typeof vi.fn> };
  let toastService: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };

  const itinerarioBase: Itinerario = {
    id: 'itin-1',
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
    favorito: false,
    fechaGeneracion: '2026-07-30T20:00:00Z',
    generadoParcial: false,
    mensajeParcial: null,
    dias: [],
    establecimientosEvaluados: [],
  };

  async function setup() {
    itinerariosService = { refinar: vi.fn() };
    toastService = { info: vi.fn(), error: vi.fn(), success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RefinamientoChatComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EcoRutaItinerariosService, useValue: itinerariosService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RefinamientoChatComponent);
    fixture.componentRef.setInput('itinerario', itinerarioBase);
    fixture.detectChanges();
  }

  function escribirYEnviar(texto: string): void {
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('input')!;
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root.querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }

  it('agrega el mensaje del usuario de inmediato, deshabilita el input y muestra el spinner mientras procesa', async () => {
    await setup();
    itinerariosService.refinar.mockReturnValue(new Subject<RefinamientoResponse>());

    escribirYEnviar('Quiero más actividades al aire libre.');

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Quiero más actividades al aire libre.');
    expect(root.querySelector<HTMLInputElement>('input')?.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(root.textContent).toContain('Espera, estoy procesando tu pedido');
  });

  it('en éxito reemplaza el historial con el del backend, lo muestra y emite el itinerario actualizado', async () => {
    await setup();
    const respuesta: RefinamientoResponse = {
      itinerario: { ...itinerarioBase, version: 2 },
      respuestaAsistente: 'Listo, agregué una caminata.',
      historialMensajes: [
        { rol: 'USUARIO', contenido: 'Quiero más actividades al aire libre.' },
        { rol: 'ASISTENTE', contenido: 'Listo, agregué una caminata.' },
      ],
      actividadParaComparar: null,
    };
    itinerariosService.refinar.mockReturnValue(of(respuesta));
    let itinerarioEmitido: Itinerario | undefined;
    fixture.componentInstance.itinerarioActualizado.subscribe((it) => (itinerarioEmitido = it));

    escribirYEnviar('Quiero más actividades al aire libre.');
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Listo, agregué una caminata.');
    expect(itinerarioEmitido?.version).toBe(2);
    expect(root.querySelector<HTMLInputElement>('input')?.disabled).toBe(false);
  });

  it('en éxito con actividadParaComparar dispara automáticamente la comparación de alternativas', async () => {
    await setup();
    const respuesta: RefinamientoResponse = {
      itinerario: itinerarioBase,
      respuestaAsistente: 'Te muestro otras opciones de hospedaje.',
      historialMensajes: [
        { rol: 'USUARIO', contenido: '¿Hay opciones de hospedaje con menor huella?' },
        { rol: 'ASISTENTE', contenido: 'Te muestro otras opciones de hospedaje.' },
      ],
      actividadParaComparar: 'act-1',
    };
    itinerariosService.refinar.mockReturnValue(of(respuesta));
    const alternativasService = TestBed.inject(EcoRutaAlternativasService);
    const spy = vi.spyOn(alternativasService, 'obtenerAlternativas').mockReturnValue(
      of({
        actividadOriginalNombre: 'Hospedaje',
        ecoScoreOriginal: 70,
        categoriaTuristica: 'NATURALEZA',
        provincia: 'Alajuela',
        alternativas: [],
        mensaje: null,
      })
    );

    escribirYEnviar('¿Hay opciones de hospedaje con menor huella?');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(itinerarioBase.id, 'act-1');
  });

  it('en error 403 muestra el toast exacto de permiso de modificación', async () => {
    await setup();
    itinerariosService.refinar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );

    escribirYEnviar('Cámbialo.');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(toastService.error).toHaveBeenCalledWith(
      'No tienes permiso para modificar este itinerario.',
      undefined,
      5000
    );
  });

  it('en timeout/error de IA muestra el toast exacto del AC y rehabilita el input', async () => {
    await setup();
    itinerariosService.refinar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 504 }))
    );

    escribirYEnviar('Cámbialo.');
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(toastService.error).toHaveBeenCalledWith(
      'No fue posible actualizar el itinerario. Intenta nuevamente.',
      undefined,
      5000
    );
    expect(root.querySelector<HTMLInputElement>('input')?.disabled).toBe(false);
  });
});
