import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { ComparacionEmisionesResponse } from '../emissions/models/emision.model';
import { EmisionesService } from '../emissions/emisiones.service';
import { ImaService } from './ima.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let emisionesService: { obtenerComparacion: ReturnType<typeof vi.fn> };
  let imaService: {
    obtenerIma: ReturnType<typeof vi.fn>;
    obtenerBenchmark: ReturnType<typeof vi.fn>;
  };
  let toastService: { error: ReturnType<typeof vi.fn> };

  const comparacionBase: ComparacionEmisionesResponse = {
    anio: 2026,
    huellaAcumuladaT: 30,
    limiteT: 50,
    porcentajeConsumido: 60,
    estado: 'dentro',
    mensaje: null,
  };

  const benchmarkBase = {
    benchmarkDisponible: false,
    cantidadEmpresas: 4,
    imaParcial: false,
    ima: null,
    cobertura: null,
    puntajeIntensidadSectorial: null,
    consistencia: null,
  };

  beforeEach(async () => {
    emisionesService = {
      obtenerComparacion: vi.fn().mockReturnValue(of(comparacionBase)),
    };
    imaService = {
      obtenerIma: vi.fn().mockReturnValue(of({ ima: 0, parcial: true })),
      obtenerBenchmark: vi.fn().mockReturnValue(of(benchmarkBase)),
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
        { provide: ImaService, useValue: imaService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('carga la comparacion con el anio actual por defecto', () => {
    expect(emisionesService.obtenerComparacion).toHaveBeenCalledWith(new Date().getFullYear());
    expect((component as any).comparacion()).toEqual(comparacionBase);
  });

  it('muestra los KPIs superiores de comparacion anual', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Huella total 2026');
    expect(texto).toContain('Del limite anual');
    expect(texto).toContain('30 / 50 tCO2e');
  });

  it('mantiene el acceso del shell compartido a mis emisiones', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Mis Emisiones');
  });

  it('asigna el estado visual segun los umbrales de porcentaje', () => {
    expect(
      (component as any).estadoPresentacion({ ...comparacionBase, porcentajeConsumido: 79.9 })
    ).toBe('dentro');
    expect(
      (component as any).estadoPresentacion({ ...comparacionBase, porcentajeConsumido: 80 })
    ).toBe('cerca');
    expect(
      (component as any).estadoPresentacion({ ...comparacionBase, porcentajeConsumido: 100 })
    ).toBe('cerca');
    expect(
      (component as any).estadoPresentacion({ ...comparacionBase, porcentajeConsumido: 100.1 })
    ).toBe('superado');
  });

  it('muestra toast de 5 segundos si falla la carga', async () => {
    emisionesService.obtenerComparacion.mockReturnValueOnce(throwError(() => new Error('network')));

    await (component as any).cargarComparacion(2026);

    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo cargar la comparación. Intente nuevamente.',
      undefined,
      5000
    );
  });

  it('carga el benchmark sectorial con el periodo actual por defecto', () => {
    expect(imaService.obtenerBenchmark).toHaveBeenCalledWith(
      new Date().getFullYear(),
      new Date().getMonth() + 1
    );
    expect((component as any).benchmarkData()).toEqual(benchmarkBase);
    expect((component as any).benchmarkError()).toBe(false);
  });

  it('si falla el benchmark marca el error y muestra el toast', async () => {
    imaService.obtenerBenchmark.mockReturnValueOnce(throwError(() => new Error('network')));

    await (component as any).cargarBenchmark(2026, 7);

    expect((component as any).benchmarkError()).toBe(true);
    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo cargar el benchmark sectorial. Intente nuevamente.',
      undefined,
      5000
    );
  });
});
