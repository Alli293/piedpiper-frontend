import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { DashboardPageComponent } from './dashboard-page.component';
import { ComparacionEmisionesResponse, DashboardService } from './dashboard.service';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let dashboardService: { obtenerComparacion: ReturnType<typeof vi.fn> };
  let toastService: { error: ReturnType<typeof vi.fn> };

  const comparacionBase: ComparacionEmisionesResponse = {
    anio: 2026,
    huellaAcumuladaT: 30,
    limiteT: 50,
    porcentajeConsumido: 60,
    estado: 'dentro',
    mensaje: null,
  };

  beforeEach(async () => {
    dashboardService = {
      obtenerComparacion: vi.fn().mockReturnValue(of(comparacionBase)),
    };
    toastService = {
      toasts: signal([]),
      error: vi.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga la comparacion con el anio actual por defecto', () => {
    expect(dashboardService.obtenerComparacion).toHaveBeenCalledWith(new Date().getFullYear());
    expect((component as any).comparacion()).toEqual(comparacionBase);
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

  it('muestra toast de 5 segundos si falla la carga', () => {
    dashboardService.obtenerComparacion.mockReturnValueOnce(throwError(() => new Error('network')));

    (component as any).cargarComparacion(2026);

    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo cargar la comparación. Intente nuevamente.',
      undefined,
      5000
    );
  });
});
