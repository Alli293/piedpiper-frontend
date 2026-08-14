import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { CalendarioVencimientosComponent } from './calendario-vencimientos.component';
import { CalendarioVencimientosResponse } from '../dashboard/dashboard.model';

describe('CalendarioVencimientosComponent', () => {
  let componentRef: ComponentRef<CalendarioVencimientosComponent>;
  let fixture: ComponentFixture<CalendarioVencimientosComponent>;

  const CALENDARIO_JULIO_2026: CalendarioVencimientosResponse = {
    mesVisualizado: '2026-07',
    vencimientosPorFecha: {
      '2026-07-03': [{ id: 'c1', nombre: 'Carbono Neutral', urgencia: '7_dias' }],
      '2026-07-18': [{ id: 'c2', nombre: 'Inventario de GEI', urgencia: '30_dias' }],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarioVencimientosComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CalendarioVencimientosComponent);
    componentRef = fixture.componentRef;
    componentRef.setInput('mes', '2026-07');
  });

  it('muestra el mensaje de carga cuando loading es true', () => {
    componentRef.setInput('loading', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-calendario__loading')).toBeTruthy();
    expect(el.querySelectorAll('.ch-calendario__day').length).toBe(0);
  });

  it('muestra el mensaje de error cuando error tiene un valor', () => {
    componentRef.setInput(
      'error',
      'No fue posible cargar esta sección. Intenta recargar la página.'
    );
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ch-calendario__error')?.textContent).toContain(
      'No fue posible cargar esta sección'
    );
  });

  it('mantiene la grilla montada al navegar de mes con datos ya cargados, sin volver al mensaje de carga', () => {
    componentRef.setInput('calendario', CALENDARIO_JULIO_2026);
    fixture.detectChanges();

    componentRef.setInput('loading', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.ch-calendario__loading')).toBeFalsy();
    expect(el.querySelectorAll('.ch-calendario__day').length).toBeGreaterThan(0);
  });

  it('marca con indicador solo los días que tienen vencimientos', () => {
    componentRef.setInput('calendario', CALENDARIO_JULIO_2026);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const diasConDot = el.querySelectorAll('.ch-calendario__day--con-vencimiento');
    expect(diasConDot.length).toBe(2);

    const dia3 = Array.from(el.querySelectorAll('.ch-calendario__day')).find(
      (d) => d.querySelector('.ch-calendario__day-number')?.textContent?.trim() === '3'
    );
    expect(dia3?.querySelector('.ch-calendario__day-dot')).toBeTruthy();
  });

  it('los días sin vencimientos no son seleccionables', () => {
    componentRef.setInput('calendario', CALENDARIO_JULIO_2026);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const diaSinVencimiento = Array.from(
      el.querySelectorAll<HTMLButtonElement>('.ch-calendario__day')
    ).find((d) => d.querySelector('.ch-calendario__day-number')?.textContent?.trim() === '10');

    expect(diaSinVencimiento?.disabled).toBe(true);
  });

  it('al seleccionar un día con indicador despliega el listado de certificaciones de ese día', () => {
    componentRef.setInput('calendario', CALENDARIO_JULIO_2026);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const dia18 = Array.from(el.querySelectorAll<HTMLButtonElement>('.ch-calendario__day')).find(
      (d) => d.querySelector('.ch-calendario__day-number')?.textContent?.trim() === '18'
    );
    dia18?.click();
    fixture.detectChanges();

    const detalle = el.querySelector('.ch-calendario__detalle');
    expect(detalle).toBeTruthy();
    expect(detalle?.textContent).toContain('Inventario de GEI');
  });

  it('"vencida" tiene su propio tono visual, distinto de 7_dias', () => {
    componentRef.setInput('calendario', {
      mesVisualizado: '2026-07',
      vencimientosPorFecha: {
        '2026-07-03': [{ id: 'c1', nombre: 'Carbono Neutral', urgencia: 'vencida' }],
      },
    });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const dia3 = Array.from(el.querySelectorAll('.ch-calendario__day')).find(
      (d) => d.querySelector('.ch-calendario__day-number')?.textContent?.trim() === '3'
    );
    expect(dia3?.classList.contains('ch-calendario__day--vencida')).toBe(true);
    expect(dia3?.classList.contains('ch-calendario__day--urgencia-7')).toBe(false);
  });

  it('mes sin vencimientos no marca ningún día con indicador', () => {
    componentRef.setInput('calendario', { mesVisualizado: '2026-08', vencimientosPorFecha: {} });
    componentRef.setInput('mes', '2026-08');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.ch-calendario__day--con-vencimiento').length).toBe(0);
  });

  it('emite mesChange al mes siguiente al navegar hacia adelante', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const emitidos: string[] = [];
    fixture.componentInstance.mesChange.subscribe((mes) => emitidos.push(mes));

    (el.querySelector('[aria-label="Mes siguiente"]') as HTMLButtonElement)?.click();

    expect(emitidos).toEqual(['2026-08']);
  });

  it('emite mesChange al mes anterior al navegar hacia atrás', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const emitidos: string[] = [];
    fixture.componentInstance.mesChange.subscribe((mes) => emitidos.push(mes));

    (el.querySelector('[aria-label="Mes anterior"]') as HTMLButtonElement)?.click();

    expect(emitidos).toEqual(['2026-06']);
  });

  it('navega correctamente el cruce de año (diciembre a enero)', () => {
    componentRef.setInput('mes', '2026-12');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const emitidos: string[] = [];
    fixture.componentInstance.mesChange.subscribe((mes) => emitidos.push(mes));

    (el.querySelector('[aria-label="Mes siguiente"]') as HTMLButtonElement)?.click();

    expect(emitidos).toEqual(['2027-01']);
  });
});
