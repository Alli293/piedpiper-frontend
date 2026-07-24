import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../shared/services/toast.service';
import { ImaService, ImaResponse } from '../dashboard/ima.service';
import { BenchmarkPageComponent } from './benchmark-page.component';

const ANIO_ACTUAL = new Date().getFullYear();
const MES_ACTUAL = new Date().getMonth() + 1;

function imaCompleto(): ImaResponse {
  return {
    cobertura: 75,
    puntajeIntensidadSectorial: 58,
    consistencia: 80,
    ima: 71,
    parcial: false,
    motivoParcial: null,
    intensidad: 1.5,
    calculatedAt: '2026-07-18T00:00:00Z',
    interpretacion: 'Tu empresa tiene buen desempeño ambiental.',
    siguientePaso: 'Reducir emisiones de flota vehicular en un 10%.',
  };
}

function imaNoDisponible(): ImaResponse {
  return {
    cobertura: 75,
    puntajeIntensidadSectorial: 58,
    consistencia: 80,
    ima: 71,
    parcial: false,
    motivoParcial: null,
    intensidad: 1.5,
    calculatedAt: '2026-07-18T00:00:00Z',
    interpretacion: 'No disponible',
    siguientePaso: 'No disponible',
  };
}

describe('BenchmarkPageComponent', () => {
  let fixture: ComponentFixture<BenchmarkPageComponent>;
  let component: BenchmarkPageComponent;
  let imaService: { obtenerIma: ReturnType<typeof vi.fn> };
  let authSession: {
    getUserInitials: ReturnType<typeof vi.fn>;
    getRole: ReturnType<typeof vi.fn>;
    getUserName: ReturnType<typeof vi.fn>;
    getUserEmail: ReturnType<typeof vi.fn>;
    getUserId: ReturnType<typeof vi.fn>;
  };
  let toastService: { error: ReturnType<typeof vi.fn>; toasts: ReturnType<typeof signal> };

  beforeEach(async () => {
    imaService = {
      obtenerIma: vi.fn().mockReturnValue(of(imaCompleto())),
    };
    authSession = {
      getUserInitials: vi.fn().mockReturnValue('AJ'),
      getRole: vi.fn().mockReturnValue('administrador_empresa'),
      getUserName: vi.fn().mockReturnValue('Test User'),
      getUserEmail: vi.fn().mockReturnValue('test@test.com'),
      getUserId: vi.fn().mockReturnValue('123'),
    };
    toastService = {
      toasts: signal([]),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BenchmarkPageComponent],
      providers: [
        provideRouter([]),
        { provide: ImaService, useValue: imaService },
        { provide: AuthSessionService, useValue: authSession },
        { provide: ToastService, useValue: toastService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  async function createFixture(): Promise<ComponentFixture<BenchmarkPageComponent>> {
    fixture = TestBed.createComponent(BenchmarkPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('carga el IMA al inicializar', async () => {
    await createFixture();

    expect(imaService.obtenerIma).toHaveBeenCalledWith(ANIO_ACTUAL, MES_ACTUAL);
  });

  it('muestra interpretación válida', async () => {
    await createFixture();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.ima-ia')).toBeTruthy();
    expect(el.textContent).toContain('Tu empresa tiene buen desempeño ambiental.');
  });

  it('muestra aviso No disponible', async () => {
    imaService.obtenerIma.mockReturnValue(of(imaNoDisponible()));
    await createFixture();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.ima-ia-unavailable')).toBeTruthy();
    expect(el.textContent).toContain(
      'La interpretación con IA no está disponible en este momento.'
    );
  });

  it('muestra toast en error HTTP', async () => {
    imaService.obtenerIma.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { message: 'Servicio no disponible.' },
          })
      )
    );
    await createFixture();

    expect(toastService.error).toHaveBeenCalledWith('Servicio no disponible.', undefined, 5000);
  });

  it('re-fetch al cambiar período', async () => {
    await createFixture();
    imaService.obtenerIma.mockClear();
    imaService.obtenerIma.mockReturnValue(of(imaCompleto()));

    (component as any).onImaPeriodoChange({ anio: 2025, mes: 3 });
    await fixture.whenStable();

    expect(imaService.obtenerIma).toHaveBeenCalledWith(2025, 3);
  });

  it('no muestra Cargando indefinidamente en error', async () => {
    imaService.obtenerIma.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: null }))
    );
    await createFixture();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).not.toContain('Cargando IMA...');
  });
});
