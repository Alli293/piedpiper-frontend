import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardPageComponent, SIN_EMISIONES_MENSAJE } from './dashboard-page.component';
import { EmisionesService } from '../emissions/emisiones.service';
import { ToastService } from '../../shared/services/toast.service';
import { ResumenEmisionesResponse } from '../emissions/models/emision.model';

const ANIO_ACTUAL = new Date().getFullYear();

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
  let obtenerResumen: ReturnType<typeof vi.fn>;
  let toastError: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    obtenerResumen = vi.fn().mockReturnValue(of(RESUMEN_CON_DATOS));
    toastError = vi.fn();

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        { provide: EmisionesService, useValue: { obtenerResumen } },
        {
          provide: ToastService,
          useValue: {
            toasts: signal([]),
            error: toastError,
            success: vi.fn(),
            show: vi.fn(),
            dismiss: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  async function createFixture() {
    const fixture = TestBed.createComponent(DashboardPageComponent);
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

  it('consulta el año actual completo al iniciar', async () => {
    await createFixture();

    expect(obtenerResumen).toHaveBeenCalledWith(ANIO_ACTUAL, undefined);
  });

  it('calcula porcentajes correctos a partir de los subtotales por categoría', async () => {
    obtenerResumen.mockReturnValue(
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
    obtenerResumen.mockReturnValue(of(RESUMEN_VACIO));
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

  it('al cambiar el período vuelve a consultar y actualiza la vista', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    obtenerResumen.mockReturnValue(of(RESUMEN_VACIO));

    setSelectValue(root, 1, '3');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(obtenerResumen).toHaveBeenLastCalledWith(ANIO_ACTUAL, 3);
    expect(root.querySelector('.dashboard-page__vacio')).not.toBeNull();
  });

  it('ante un error de servidor muestra el toast de fallo de carga', async () => {
    obtenerResumen.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: null }))
    );
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(toastError).toHaveBeenCalledWith(
      'No se pudo cargar el desglose. Intente nuevamente.',
      undefined,
      5000
    );
    expect(root.querySelector('.dashboard-page__leyenda')).toBeNull();
  });

  it('expone el mensaje del API en el toast cuando la respuesta de error lo incluye', async () => {
    obtenerResumen.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'El mes debe estar entre 1 y 12.' },
          })
      )
    );
    await createFixture();

    expect(toastError).toHaveBeenCalledWith('El mes debe estar entre 1 y 12.', undefined, 5000);
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
