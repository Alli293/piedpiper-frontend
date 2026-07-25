import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PerfilInicialService } from '../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../core/models/perfil-inicial.model';
import { ToastService } from '../../shared/services/toast.service';
import {
  ComparacionEmisionesResponse,
  ResumenEmisionesResponse,
} from '../emissions/models/emision.model';
import { EmisionesService } from '../emissions/emisiones.service';
import { DashboardPageComponent, SIN_EMISIONES_MENSAJE } from './dashboard-page.component';
import { ResumenHuellaDashboardResponse } from './dashboard.model';
import { DashboardService } from './dashboard.service';
import { EvolucionService } from './evolucion.service';
import { BenchmarkPanelComponent } from './benchmark-panel.component';
import { EvolucionChartComponent } from './evolucion-chart.component';
import { ImaPanelComponent } from './ima-panel.component';
import { BenchmarkSectorialResponse, ImaService } from './ima.service';
import { Component, input } from '@angular/core';

const ANIO_ACTUAL = new Date().getFullYear();

const COMPARACION_BASE: ComparacionEmisionesResponse = {
  anio: 2026,
  huellaAcumuladaT: 5.236,
  limiteT: 12.47,
  porcentajeConsumido: 42,
  estado: 'dentro',
  mensaje: null,
  categorias: [
    { categoria: 'ELECTRICIDAD', huellaT: 2.357, porcentaje: 45 },
    { categoria: 'FLOTA', huellaT: 1.466, porcentaje: 28 },
    { categoria: 'VUELO', huellaT: 0.942, porcentaje: 18 },
    { categoria: 'ENVIO', huellaT: 0.471, porcentaje: 9 },
  ],
};

const RESUMEN_HUELLA_BASE: ResumenHuellaDashboardResponse = {
  periodoSeleccionado: 'mes_actual',
  huellaTotalT: 5.236,
  variacionPorcentual: 30.9,
  tieneDatos: true,
};

const RESUMEN_CON_DATOS: ResumenEmisionesResponse = {
  anio: ANIO_ACTUAL,
  mes: null,
  totalKg: 5236000,
  totalT: 5236,
  categorias: [
    { categoria: 'ELECTRICIDAD', totalKg: 2356200, porcentaje: 45 },
    { categoria: 'FLOTA', totalKg: 1466080, porcentaje: 28 },
    { categoria: 'VUELO', totalKg: 942480, porcentaje: 18 },
    { categoria: 'ENVIO', totalKg: 471240, porcentaje: 9 },
  ],
};

const RESUMEN_VACIO: ResumenEmisionesResponse = {
  anio: ANIO_ACTUAL,
  mes: null,
  totalKg: 0,
  totalT: 0,
  categorias: [
    { categoria: 'ELECTRICIDAD', totalKg: 0, porcentaje: 0 },
    { categoria: 'FLOTA', totalKg: 0, porcentaje: 0 },
    { categoria: 'VUELO', totalKg: 0, porcentaje: 0 },
    { categoria: 'ENVIO', totalKg: 0, porcentaje: 0 },
  ],
};

const BENCHMARK_BASE: BenchmarkSectorialResponse = {
  benchmarkDisponible: false,
  cantidadEmpresas: 4,
  imaParcial: false,
  ima: null,
  cobertura: null,
  puntajeIntensidadSectorial: null,
  consistencia: null,
};

@Component({ selector: 'app-evolucion-chart', standalone: true, template: '' })
class StubChartComponent {
  readonly serie = input([]);
  readonly anio = input(2026);
}

@Component({ selector: 'app-ima-panel', standalone: true, template: '' })
class StubImaPanelComponent {
  readonly ima = input(null);
  readonly anio = input(2026);
  readonly mes = input(7);
}

@Component({ selector: 'app-benchmark-panel', standalone: true, template: '' })
class StubBenchmarkPanelComponent {
  readonly benchmark = input(null);
  readonly error = input(false);
}

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let emisionesService: {
    obtenerComparacion: ReturnType<typeof vi.fn>;
    obtenerResumen: ReturnType<typeof vi.fn>;
  };
  let dashboardService: {
    exportarReportePdf: ReturnType<typeof vi.fn>;
    obtenerResumenHuella: ReturnType<typeof vi.fn>;
  };
  let imaService: {
    obtenerIma: ReturnType<typeof vi.fn>;
    obtenerBenchmark: ReturnType<typeof vi.fn>;
  };
  let authService: {
    cerrarSesion: ReturnType<typeof vi.fn>;
    token: ReturnType<typeof signal<string | null>>;
  };
  let toastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    emisionesService = {
      obtenerComparacion: vi.fn().mockReturnValue(of(COMPARACION_BASE)),
      obtenerResumen: vi.fn().mockReturnValue(of(RESUMEN_CON_DATOS)),
    };
    dashboardService = {
      obtenerResumenHuella: vi.fn().mockReturnValue(of(RESUMEN_HUELLA_BASE)),
      exportarReportePdf: vi
        .fn()
        .mockReturnValue(of(new Blob(['pdf'], { type: 'application/pdf' }))),
    };
    imaService = {
      obtenerIma: vi.fn().mockReturnValue(
        of({
          cobertura: 0,
          consistencia: 0,
          ima: 0,
          parcial: true,
          motivoParcial: null,
          puntajeIntensidadSectorial: null,
          intensidad: null,
          calculatedAt: '',
          interpretacion: null,
          siguientePaso: null,
        })
      ),
      obtenerBenchmark: vi.fn().mockReturnValue(of(BENCHMARK_BASE)),
    };
    authService = {
      cerrarSesion: vi.fn(),
      token: signal<string | null>(null),
    };
    toastService = {
      toasts: signal([]),
      error: vi.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: EmisionesService, useValue: emisionesService },
        { provide: DashboardService, useValue: dashboardService },
        {
          provide: EvolucionService,
          useValue: { obtenerEvolucion: () => of({ anio: 2026, serie: [] }) },
        },
        { provide: ImaService, useValue: imaService },
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toastService },
        {
          provide: PerfilInicialService,
          useValue: {
            perfil: () => ({ nombre: 'Ariela', apellidos: 'Jimenez', empresa: null }),
            obtener: () =>
              of({ nombre: 'Ariela', apellidos: 'Jimenez', empresa: null } as PerfilInicial),
          },
        },
      ],
    })
      .overrideComponent(DashboardPageComponent, {
        remove: { imports: [EvolucionChartComponent, ImaPanelComponent, BenchmarkPanelComponent] },
        add: {
          imports: [StubChartComponent, StubImaPanelComponent, StubBenchmarkPanelComponent],
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
        },
      })
      .compileComponents();
  });

  async function createFixture(): Promise<ComponentFixture<DashboardPageComponent>> {
    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function setSelectValue(root: HTMLElement, index: number, value: string): void {
    const selects = root.querySelectorAll<HTMLSelectElement>('app-select-input select');
    const select = selects[index];
    if (!select) throw new Error(`Select not found at index ${index}`);
    select.value = value;
    select.dispatchEvent(new Event('change'));
  }

  // ---------------------------------------------------------------------------
  // Panel de límite anual (PP-40)
  // ---------------------------------------------------------------------------

  it('carga la comparacion con el anio actual por defecto', async () => {
    await createFixture();

    expect(emisionesService.obtenerComparacion).toHaveBeenCalledWith(ANIO_ACTUAL);
    expect((component as any).comparacion()).toEqual(COMPARACION_BASE);
  });

  it('muestra los KPIs superiores de comparacion anual', async () => {
    await createFixture();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Huella total 2026');
    expect(texto).toContain('Del limite anual');
    expect(texto).toContain('5,236 / 12,47 tCO2e');
  });

  it('carga el resumen de huella con mes actual y el anio seleccionado por defecto', async () => {
    await createFixture();

    expect(dashboardService.obtenerResumenHuella).toHaveBeenCalledWith('mes_actual', ANIO_ACTUAL);
    expect((component as any).resumenHuella()).toEqual(RESUMEN_HUELLA_BASE);
  });

  it('muestra la huella del periodo y su variacion', async () => {
    await createFixture();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('5,236');
    expect(texto).toContain('tCO₂e este mes');
    expect(texto).toContain('+30,9 % vs periodo anterior');
  });

  it('si el periodo no tiene datos muestra mensaje sin indicador de variacion', async () => {
    await createFixture();
    dashboardService.obtenerResumenHuella.mockReturnValueOnce(
      of({
        periodoSeleccionado: 'mes_actual',
        huellaTotalT: 0,
        variacionPorcentual: null,
        tieneDatos: false,
      })
    );

    await (component as any).cargarResumenHuella('mes_actual', 2026);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay datos de huella registrados para este periodo.');
    expect(texto).not.toContain('vs periodo anterior');
  });

  it('si falla el resumen muestra error sin borrar la comparacion anual', async () => {
    await createFixture();
    dashboardService.obtenerResumenHuella.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Servicio temporalmente no disponible.' },
          })
      )
    );
    emisionesService.obtenerResumen.mockReturnValueOnce(throwError(() => new Error('network')));

    await (component as any).cargarResumenHuella('mes_actual', 2026);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Servicio temporalmente no disponible.');
    expect(texto).toContain('Del limite anual');
  });

  it('usa el resumen de emisiones como fallback cuando falla el endpoint de resumen de huella', async () => {
    await createFixture();
    dashboardService.obtenerResumenHuella.mockReturnValueOnce(throwError(() => new Error('404')));
    emisionesService.obtenerResumen.mockReturnValueOnce(
      of({
        ...RESUMEN_CON_DATOS,
        mes: new Date().getMonth() + 1,
        totalKg: 620000,
        totalT: 620,
      })
    );

    await (component as any).cargarResumenHuella('mes_actual', 2026);
    fixture.detectChanges();

    expect(emisionesService.obtenerResumen).toHaveBeenCalledWith(2026, new Date().getMonth() + 1);
    expect((component as any).resumenHuella().huellaTotalT).toBe(620);
    expect((component as any).resumenHuellaError()).toBeNull();
  });

  it('el cambio de periodo solo recarga el resumen de huella', async () => {
    await createFixture();
    dashboardService.obtenerResumenHuella.mockClear();
    emisionesService.obtenerComparacion.mockClear();
    dashboardService.obtenerResumenHuella.mockReturnValueOnce(
      of({
        periodoSeleccionado: 'trimestre',
        huellaTotalT: 7.5,
        variacionPorcentual: null,
        tieneDatos: true,
      })
    );

    (component as any).onPeriodoChange('trimestre');
    await fixture.whenStable();

    expect(dashboardService.obtenerResumenHuella).toHaveBeenCalledWith('trimestre', ANIO_ACTUAL);
    expect(emisionesService.obtenerComparacion).not.toHaveBeenCalled();
  });

  it('ignora respuestas viejas si el periodo cambia rapidamente', async () => {
    await createFixture();
    const respuestaLenta = new Subject<ResumenHuellaDashboardResponse>();
    const respuestaRapida = new Subject<ResumenHuellaDashboardResponse>();
    dashboardService.obtenerResumenHuella.mockClear();
    dashboardService.obtenerResumenHuella.mockReturnValueOnce(respuestaLenta.asObservable());
    dashboardService.obtenerResumenHuella.mockReturnValueOnce(respuestaRapida.asObservable());

    (component as any).onPeriodoChange('trimestre');
    (component as any).onPeriodoChange('año');

    respuestaRapida.next({
      periodoSeleccionado: 'año',
      huellaTotalT: 9,
      variacionPorcentual: null,
      tieneDatos: true,
    });
    respuestaRapida.complete();
    await fixture.whenStable();

    respuestaLenta.next({
      periodoSeleccionado: 'trimestre',
      huellaTotalT: 2,
      variacionPorcentual: null,
      tieneDatos: true,
    });
    respuestaLenta.complete();
    await fixture.whenStable();

    expect((component as any).periodoSeleccionado()).toBe('año');
    expect((component as any).resumenHuella().huellaTotalT).toBe(9);
  });

  it('ignora respuestas viejas si el anio cambia rapidamente', async () => {
    await createFixture();
    const comparacionLenta = new Subject<ComparacionEmisionesResponse>();
    const comparacionRapida = new Subject<ComparacionEmisionesResponse>();
    emisionesService.obtenerComparacion.mockClear();
    emisionesService.obtenerComparacion.mockReturnValueOnce(comparacionLenta.asObservable());
    emisionesService.obtenerComparacion.mockReturnValueOnce(comparacionRapida.asObservable());

    void (component as any).cargarComparacion(2021);
    void (component as any).cargarComparacion(2022);

    comparacionRapida.next({
      ...COMPARACION_BASE,
      anio: 2022,
      huellaAcumuladaT: 22,
    });
    comparacionRapida.complete();
    await fixture.whenStable();

    comparacionLenta.next({
      ...COMPARACION_BASE,
      anio: 2021,
      huellaAcumuladaT: 21,
    });
    comparacionLenta.complete();
    await fixture.whenStable();

    expect((component as any).comparacion().anio).toBe(2022);
    expect((component as any).comparacion().huellaAcumuladaT).toBe(22);
  });

  it('al cambiar el anio recarga el resumen de huella con ese anio', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    dashboardService.obtenerResumenHuella.mockClear();
    dashboardService.obtenerResumenHuella.mockReturnValueOnce(
      of({
        periodoSeleccionado: 'mes_actual',
        huellaTotalT: 0,
        variacionPorcentual: null,
        tieneDatos: false,
      })
    );

    setSelectValue(root, 0, '2021');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dashboardService.obtenerResumenHuella).toHaveBeenCalledWith('mes_actual', 2021);
  });

  it('mantiene el acceso del shell compartido a mis emisiones', async () => {
    await createFixture();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Mis Emisiones');
  });

  it('usa el estado enviado por el backend para pintar el panel', async () => {
    await createFixture();
    (component as any).comparacion.set({
      ...COMPARACION_BASE,
      estado: 'superado',
      porcentajeConsumido: 60,
    });
    fixture.detectChanges();

    expect((component as any).tieneEstado('superado')).toBe(true);
    expect(fixture.nativeElement.querySelector('.annual-limit-panel.is-superado')).toBeTruthy();
  });

  it('muestra el limite anual desglosado por categorias', async () => {
    await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    const texto = root.textContent ?? '';

    expect(texto).toContain('Electricidad');
    expect(texto).toContain('Flota vehicular');
    expect(texto).toContain('Vuelos');
    expect(texto).toContain('Envíos');
    expect(texto).toContain('2,357 tCO₂e');
    expect(texto).toContain('1,466 tCO₂e');
    expect(texto).toContain('0,942 tCO₂e');
    expect(texto).toContain('0,471 tCO₂e');
    expect(root.querySelectorAll('.annual-limit-panel__categories dd')).toHaveLength(4);
  });

  it('usa el porcentaje enviado por el backend para las barras de categoria', async () => {
    await createFixture();
    (component as any).comparacion.set({
      ...COMPARACION_BASE,
      categorias: [
        { categoria: 'ELECTRICIDAD', huellaT: 30, porcentaje: 60 },
        { categoria: 'FLOTA', huellaT: 10, porcentaje: 40 },
        { categoria: 'VUELO', huellaT: 0, porcentaje: 0 },
        { categoria: 'ENVIO', huellaT: 0, porcentaje: 0 },
      ],
    });
    fixture.detectChanges();

    const barras = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '.annual-limit-panel__category-track span'
      )
    );
    expect(barras.map((barra) => barra.style.width)).toEqual(['60%', '40%', '0%', '0%']);
  });

  it('renderiza el estado superado', async () => {
    await createFixture();
    (component as any).comparacion.set({
      ...COMPARACION_BASE,
      huellaAcumuladaT: 60,
      porcentajeConsumido: 120,
      estado: 'superado',
    });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Límite superado');
    expect(fixture.nativeElement.querySelector('.annual-limit-panel.is-superado')).toBeTruthy();
  });

  it('renderiza el estado alcanzado', async () => {
    await createFixture();
    (component as any).comparacion.set({
      ...COMPARACION_BASE,
      huellaAcumuladaT: 50,
      porcentajeConsumido: 100,
      estado: 'alcanzado',
    });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Alcanzado');
    expect(fixture.nativeElement.querySelector('.annual-limit-panel.is-alcanzado')).toBeTruthy();
  });

  it('renderiza el estado sin limite con appLink', async () => {
    await createFixture();
    (component as any).comparacion.set({
      ...COMPARACION_BASE,
      limiteT: null,
      porcentajeConsumido: null,
      estado: 'sin_limite',
    });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    const link = fixture.nativeElement.querySelector('.annual-limit-panel__empty a.ch-link');
    expect(texto).toContain('No se ha declarado un límite para 2026.');
    expect(link).toBeTruthy();
  });

  it('usa las iniciales del perfil en el header', async () => {
    await createFixture();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('AJ');
  });

  it('muestra mensaje de API si falla la carga de comparacion', async () => {
    await createFixture();
    emisionesService.obtenerComparacion.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Servicio no disponible.' },
          })
      )
    );

    await (component as any).cargarComparacion(2026);

    expect(toastService.error).toHaveBeenCalledWith('Servicio no disponible.', undefined, 5000);
  });

  it('muestra fallback de 5 segundos si falla la comparacion sin mensaje de API', async () => {
    await createFixture();
    emisionesService.obtenerComparacion.mockReturnValueOnce(throwError(() => new Error('network')));

    await (component as any).cargarComparacion(2026);

    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo cargar la comparación. Intente nuevamente.',
      undefined,
      5000
    );
  });

  it('no muestra datos de demostracion cuando falla la carga', async () => {
    await createFixture();
    (component as any).comparacion.set(null);
    emisionesService.obtenerComparacion.mockReturnValueOnce(throwError(() => new Error('network')));

    await (component as any).cargarComparacion(2026);
    fixture.detectChanges();

    // Se acota la búsqueda a la sección de KPIs: el textContent de toda la página
    // incluye el <select> de año (2026...2000), cuyas opciones concatenadas generan
    // falsos positivos como "42" (borde entre "2004" y "2003").
    const resumenSection = fixture.nativeElement.querySelector('.dashboard-summary') as HTMLElement;
    const texto = resumenSection?.textContent ?? '';
    expect((component as any).comparacion()).toBeNull();
    expect(texto).not.toContain('5.236');
    expect(texto).not.toContain('12.47');
    expect(texto).not.toContain('42');
  });

  // ---------------------------------------------------------------------------
  // Desglose por categoría (PP-39, dona)
  // ---------------------------------------------------------------------------

  it('consulta el resumen del año actual completo al iniciar', async () => {
    await createFixture();

    expect(emisionesService.obtenerResumen).toHaveBeenCalledWith(ANIO_ACTUAL, undefined);
  });

  it('calcula porcentajes correctos a partir de los subtotales por categoría', async () => {
    emisionesService.obtenerResumen.mockReturnValue(
      of({
        ...RESUMEN_CON_DATOS,
        totalKg: 3,
        totalT: 0.003,
        categorias: [
          { categoria: 'ELECTRICIDAD', totalKg: 1, porcentaje: 33.3 },
          { categoria: 'FLOTA', totalKg: 2, porcentaje: 66.7 },
          { categoria: 'VUELO', totalKg: 0, porcentaje: 0 },
          { categoria: 'ENVIO', totalKg: 0, porcentaje: 0 },
        ],
      })
    );
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const porcentajes = Array.from(root.querySelectorAll('.dashboard-page__fila-porcentaje')).map(
      (element) => element.textContent?.trim()
    );

    expect(porcentajes).toEqual(['33.3 %', '66.7 %', '0 %', '0 %']);
  });

  it('muestra el total en toneladas al centro de la dona y un segmento por categoría con datos', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.dashboard-page__dona-total')?.textContent?.trim()).toBe('5,236');
    expect(root.querySelector('.dashboard-page__dona-unidad')?.textContent?.trim()).toBe('tCO₂e');
    expect(root.querySelectorAll('.dashboard-page__segmento').length).toBe(4);
  });

  it('con total 0 muestra 0 % en cada categoría, el mensaje de vacío y la dona sin segmentos', async () => {
    emisionesService.obtenerResumen.mockReturnValue(of(RESUMEN_VACIO));
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const porcentajes = Array.from(root.querySelectorAll('.dashboard-page__fila-porcentaje')).map(
      (element) => element.textContent?.trim()
    );
    expect(porcentajes).toEqual(['0 %', '0 %', '0 %', '0 %']);

    expect(root.querySelector('.dashboard-page__vacio')?.textContent?.trim()).toBe(
      SIN_EMISIONES_MENSAJE
    );
    expect(root.querySelector('.dashboard-page__dona-total')?.textContent?.trim()).toBe('0');
    expect(root.querySelectorAll('.dashboard-page__segmento').length).toBe(0);
  });

  it('al cambiar el año vuelve a consultar el desglose anual y actualiza la vista', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    emisionesService.obtenerResumen.mockReturnValue(of(RESUMEN_VACIO));

    setSelectValue(root, 0, '2021');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emisionesService.obtenerResumen).toHaveBeenLastCalledWith(2021, undefined);
    expect(root.querySelector('.dashboard-page__vacio')).not.toBeNull();
  });

  it('ante un error de servidor muestra el toast de fallo de carga del desglose', async () => {
    emisionesService.obtenerResumen.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: null }))
    );
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo cargar el desglose. Intente nuevamente.',
      undefined,
      5000
    );
    expect(root.querySelector('.dashboard-page__leyenda')).toBeNull();
  });

  it('expone el mensaje del API en el toast cuando la respuesta de error del resumen lo incluye', async () => {
    emisionesService.obtenerResumen.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'El mes debe estar entre 1 y 12.' },
          })
      )
    );
    await createFixture();

    expect(toastService.error).toHaveBeenCalledWith(
      'El mes debe estar entre 1 y 12.',
      undefined,
      5000
    );
  });

  it('muestra las etiquetas de categoría del diseño', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const etiquetas = Array.from(root.querySelectorAll('.dashboard-page__fila-etiqueta')).map(
      (element) => element.textContent?.trim()
    );
    expect(etiquetas).toEqual(['Electricidad', 'Flota vehicular', 'Vuelos', 'Envíos']);
  });
});
