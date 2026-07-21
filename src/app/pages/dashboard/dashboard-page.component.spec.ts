import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../shared/services/toast.service';
import { ComparacionEmisionesResponse } from '../emissions/models/emision.model';
import { EmisionesService } from '../emissions/emisiones.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let emisionesService: { obtenerComparacion: ReturnType<typeof vi.fn> };
  let authSession: { getUserInitials: ReturnType<typeof vi.fn> };
  let authService: { cerrarSesion: ReturnType<typeof vi.fn> };
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
    emisionesService = {
      obtenerComparacion: vi.fn().mockReturnValue(of(comparacionBase)),
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
        { provide: AuthService, useValue: authService },
        { provide: AuthSessionService, useValue: authSession },
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

  it('usa el estado enviado por el backend para pintar el panel', () => {
    (component as any).comparacion.set({
      ...comparacionBase,
      estado: 'superado',
      porcentajeConsumido: 60,
    });
    fixture.detectChanges();

    expect((component as any).tieneEstado('superado')).toBe(true);
    expect(fixture.nativeElement.querySelector('.annual-limit-panel.is-superado')).toBeTruthy();
  });

  it('renderiza el estado superado', () => {
    (component as any).comparacion.set({
      ...comparacionBase,
      huellaAcumuladaT: 60,
      porcentajeConsumido: 120,
      estado: 'superado',
    });
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Límite superado');
    expect(fixture.nativeElement.querySelector('.annual-limit-panel.is-superado')).toBeTruthy();
  });

  it('renderiza el estado sin limite con appLink', () => {
    (component as any).comparacion.set({
      ...comparacionBase,
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

  it('usa iniciales de la sesion en el header', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(authSession.getUserInitials).toHaveBeenCalled();
    expect(texto).toContain('AJ');
  });

  it('muestra mensaje de API si falla la carga', async () => {
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

  it('muestra fallback de 5 segundos si falla la carga sin mensaje de API', async () => {
    emisionesService.obtenerComparacion.mockReturnValueOnce(throwError(() => new Error('network')));

    await (component as any).cargarComparacion(2026);

    expect(toastService.error).toHaveBeenCalledWith(
      'No se pudo cargar la comparación. Intente nuevamente.',
      undefined,
      5000
    );
  });
});
