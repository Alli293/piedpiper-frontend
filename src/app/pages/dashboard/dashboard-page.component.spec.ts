import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  ComparacionEmisionesResponse,
  ResumenEmisionesResponse,
} from '../emissions/models/emision.model';
import { EmisionesService } from '../emissions/emisiones.service';
import { DashboardPageComponent, SIN_EMISIONES_MENSAJE } from './dashboard-page.component';
import { DashboardService } from './dashboard.service';

const ANIO_ACTUAL = new Date().getFullYear();

const COMPARACION_BASE: ComparacionEmisionesResponse = {
  anio: 2026,
  huellaAcumuladaT: 30,
  limiteT: 50,
  porcentajeConsumido: 60,
  estado: 'dentro',
  mensaje: null,
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

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let emisionesService: {
    obtenerComparacion: ReturnType<typeof vi.fn>;
    obtenerResumen: ReturnType<typeof vi.fn>;
  };
  let dashboardService: { exportarReportePdf: ReturnType<typeof vi.fn> };
  let authSession: { getUserInitials: ReturnType<typeof vi.fn> };
  let authService: { cerrarSesion: ReturnType<typeof vi.fn> };
  let toastService: { error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    emisionesService = {
      obtenerComparacion: vi.fn().mockReturnValue(of(COMPARACION_BASE)),
      obtenerResumen: vi.fn().mockReturnValue(of(RESUMEN_CON_DATOS)),
    };
    dashboardService = {
      exportarReportePdf: vi
        .fn()
        .mockReturnValue(of(new Blob(['pdf'], { type: 'application/pdf' }))),
    };
    authSession = {
      getUserInitials: vi.fn().mockReturnValue('AJ'),
    };
    authService = {
      cerrarSesion: vi.fn(),
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
        { provide: AuthService, useValue: authService },
        { provide: AuthSessionService, useValue: authSession },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();
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
    expect(texto).toContain('30 / 50 tCO2e');
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

  it('usa iniciales de la sesion en el header', async () => {
    await createFixture();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(authSession.getUserInitials).toHaveBeenCalled();
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

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
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

  it('al cambiar el mes vuelve a consultar el resumen y actualiza la vista', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    emisionesService.obtenerResumen.mockReturnValue(of(RESUMEN_VACIO));

    setSelectValue(root, 1, '3');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(emisionesService.obtenerResumen).toHaveBeenLastCalledWith(ANIO_ACTUAL, 3);
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

    const