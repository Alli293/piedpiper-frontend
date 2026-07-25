import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { SesionInactividadService } from '../../core/auth/sesion-inactividad.service';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  ImaEvento,
  ImaService,
  ImaResponse,
  ImaTendenciaPunto,
  ImaTendenciaResponse,
} from '../dashboard/ima.service';
import { ImaTendenciaChartComponent } from './ima-tendencia-chart.component';
import {
  ERROR_BENCHMARK_MENSAJE,
  ERROR_TENDENCIA_MENSAJE,
  MadurezAmbientalPageComponent,
  SIN_HISTORIAL_MENSAJE,
  SIN_SECTOR_MENSAJE,
} from './madurez-ambiental-page.component';

@Component({ selector: 'app-ima-tendencia-chart', template: '' })
class StubTendenciaChartComponent {
  readonly serie = input<ImaTendenciaPunto[]>([]);
  readonly eventos = input<ImaEvento[]>([]);
}

const ANIO_ACTUAL = new Date().getFullYear();
const MES_ACTUAL = new Date().getMonth() + 1;

const SERIE_CON_DATOS: ImaTendenciaPunto[] = [
  { mes: '2026-04', imaEmpresa: null, imaPromedioSector: null },
  { mes: '2026-05', imaEmpresa: 68, imaPromedioSector: 63.5 },
  { mes: '2026-06', imaEmpresa: 71, imaPromedioSector: 64 },
];

const SERIE_SIN_HISTORIAL: ImaTendenciaPunto[] = [
  { mes: '2026-05', imaEmpresa: null, imaPromedioSector: null },
  { mes: '2026-06', imaEmpresa: null, imaPromedioSector: null },
];

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
    ...imaCompleto(),
    interpretacion: 'No disponible',
    siguientePaso: 'No disponible',
  };
}

describe('MadurezAmbientalPageComponent', () => {
  let fixture: ComponentFixture<MadurezAmbientalPageComponent>;
  let imaService: {
    obtenerIma: ReturnType<typeof vi.fn>;
    obtenerTendencia: ReturnType<typeof vi.fn>;
    obtenerBenchmark: ReturnType<typeof vi.fn>;
  };
  let toastService: { error: ReturnType<typeof vi.fn> };

  const respuesta = (
    serie: ImaTendenciaPunto[],
    sinDatosSectoriales = false
  ): ImaTendenciaResponse => ({ mesesAtras: 12, serie, sinDatosSectoriales, eventos: [] });

  const html = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const el = () => fixture.nativeElement as HTMLElement;

  async function crearComponente(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MadurezAmbientalPageComponent],
      providers: [
        provideRouter([]),
        { provide: ImaService, useValue: imaService },
        { provide: AuthService, useValue: { token: signal('fake-token'), cerrarSesion: vi.fn() } },
        { provide: SesionInactividadService, useValue: { reiniciar: vi.fn(), detener: vi.fn() } },
        {
          provide: AuthSessionService,
          useValue: {
            getUserInitials: vi.fn(() => 'AJ'),
            getUserDisplayName: vi.fn(() => 'Ana Jiménez'),
            getRole: vi.fn(() => 'usuario_general_empresa'),
            isAdministradorEmpresa: vi.fn(() => false),
            getToken: vi.fn(() => 'fake-token'),
          },
        },
        { provide: ToastService, useValue: toastService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .overrideComponent(MadurezAmbientalPageComponent, {
        remove: { imports: [ImaTendenciaChartComponent] },
        add: { imports: [StubTendenciaChartComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MadurezAmbientalPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    imaService = {
      obtenerIma: vi.fn().mockReturnValue(of(imaCompleto())),
      obtenerTendencia: vi.fn().mockReturnValue(of(respuesta(SERIE_CON_DATOS))),
      obtenerBenchmark: vi.fn().mockReturnValue(
        of({
          benchmarkDisponible: true,
          cantidadEmpresas: 28,
          imaParcial: false,
          ima: { valorEmpresa: 71, promedioSector: 64, posicion: 'POR_ENCIMA' },
          cobertura: { valorEmpresa: 75, promedioSector: 70, posicion: 'POR_ENCIMA' },
          puntajeIntensidadSectorial: {
            valorEmpresa: 58,
            promedioSector: 62,
            posicion: 'POR_DEBAJO',
          },
          consistencia: { valorEmpresa: 80, promedioSector: 60, posicion: 'POR_ENCIMA' },
        })
      ),
    };
    toastService = { toasts: signal([]), error: vi.fn() } as never;
  });

  // --- Panel IMA + interpretación IA ---

  it('carga el IMA del período actual al inicializar', async () => {
    await crearComponente();

    expect(imaService.obtenerIma).toHaveBeenCalledWith(ANIO_ACTUAL, MES_ACTUAL);
  });

  it('muestra la interpretación de IA cuando está disponible', async () => {
    await crearComponente();

    expect(el().querySelector('.ch-ima-ia')).toBeTruthy();
    expect(html()).toContain('Tu empresa tiene buen desempeño ambiental.');
  });

  it('muestra el aviso cuando la interpretación no está disponible', async () => {
    imaService.obtenerIma.mockReturnValue(of(imaNoDisponible()));
    await crearComponente();

    expect(el().querySelector('.ch-ima-ia-unavailable')).toBeTruthy();
    expect(html()).toContain('La interpretación con IA no está disponible en este momento.');
  });

  it('muestra toast con el mensaje de la API cuando falla la carga del IMA', async () => {
    imaService.obtenerIma.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: { message: 'Servicio no disponible.' } })
      )
    );
    await crearComponente();

    expect(toastService.error).toHaveBeenCalledWith('Servicio no disponible.', undefined, 5000);
  });

  it('vuelve a consultar el IMA al cambiar el período', async () => {
    await crearComponente();
    imaService.obtenerIma.mockClear();
    imaService.obtenerIma.mockReturnValue(of(imaCompleto()));

    (
      fixture.componentInstance as unknown as {
        onImaPeriodoChange: (e: { anio: number; mes: number }) => void;
      }
    ).onImaPeriodoChange({ anio: 2025, mes: 3 });
    await fixture.whenStable();

    expect(imaService.obtenerIma).toHaveBeenCalledWith(2025, 3);
  });

  it('no queda cargando indefinidamente cuando el IMA falla', async () => {
    imaService.obtenerIma.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: null }))
    );
    await crearComponente();
    fixture.detectChanges();

    expect(html()).not.toContain('Cargando IMA...');
  });

  // --- Evolución histórica del IMA ---

  it('solicita la ventana de 12 meses por defecto al iniciar', async () => {
    await crearComponente();

    expect(imaService.obtenerTendencia).toHaveBeenCalledWith(12);
  });

  it('muestra el grafico cuando hay historial', async () => {
    await crearComponente();

    const grafico = el().querySelector('app-ima-tendencia-chart');
    expect(grafico).toBeTruthy();
    expect(html()).not.toContain(SIN_HISTORIAL_MENSAJE);
  });

  it('muestra el estado vacio cuando la empresa no tiene snapshots', async () => {
    imaService.obtenerTendencia.mockReturnValue(of(respuesta(SERIE_SIN_HISTORIAL)));
    await crearComponente();

    expect(html()).toContain(SIN_HISTORIAL_MENSAJE);
    expect(el().querySelector('app-ima-tendencia-chart')).toBeFalsy();
  });

  it('avisa cuando no hay datos sectoriales suficientes para comparar', async () => {
    imaService.obtenerTendencia.mockReturnValue(of(respuesta(SERIE_CON_DATOS, true)));
    await crearComponente();

    expect(html()).toContain(SIN_SECTOR_MENSAJE);
  });

  it('no muestra el aviso sectorial cuando si hay comparacion', async () => {
    await crearComponente();

    expect(html()).not.toContain(SIN_SECTOR_MENSAJE);
  });

  it('recarga la tendencia al cambiar la ventana', async () => {
    await crearComponente();
    imaService.obtenerTendencia.mockClear();

    const select = el().querySelector('.ch-madurez-card select');
    expect(select).toBeTruthy();
    (select as HTMLSelectElement).value = '6';
    select?.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(imaService.obtenerTendencia).toHaveBeenCalledWith(6);
  });

  it('ignora valores de ventana fuera de las opciones del select', async () => {
    await crearComponente();
    imaService.obtenerTendencia.mockClear();

    (
      fixture.componentInstance as unknown as { onVentanaChange: (v: string) => void }
    ).onVentanaChange('999');

    expect(imaService.obtenerTendencia).not.toHaveBeenCalled();
  });

  it('descarta respuestas de tendencia fuera de orden', async () => {
    const primera = new Subject<ImaTendenciaResponse>();
    const segunda = new Subject<ImaTendenciaResponse>();
    imaService.obtenerTendencia
      .mockReturnValueOnce(primera.asObservable())
      .mockReturnValueOnce(segunda.asObservable());

    await crearComponente();

    const pagina = fixture.componentInstance as unknown as {
      onVentanaChange: (v: string) => void;
      serie: () => ImaTendenciaPunto[];
    };
    pagina.onVentanaChange('12');

    // La segunda petición (12 meses) resuelve primero.
    segunda.next(respuesta(SERIE_CON_DATOS));
    segunda.complete();
    await fixture.whenStable();

    // La primera (3/12 default) resuelve después con datos viejos: debe ignorarse.
    primera.next(respuesta(SERIE_SIN_HISTORIAL));
    primera.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(pagina.serie()).toEqual(SERIE_CON_DATOS);
    expect(html()).not.toContain(SIN_HISTORIAL_MENSAJE);
  });

  it('muestra un toast con el mensaje de la API cuando falla la carga', async () => {
    imaService.obtenerTendencia.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { message: 'La ventana no es válida.' } })
      )
    );
    await crearComponente();

    expect(toastService.error).toHaveBeenCalledWith('La ventana no es válida.', undefined, 5000);
  });

  it('usa el mensaje de respaldo cuando la API no envia detalle', async () => {
    imaService.obtenerTendencia.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    await crearComponente();

    expect(toastService.error).toHaveBeenCalledWith(ERROR_TENDENCIA_MENSAJE, undefined, 5000);
  });

  // --- Comparación contra tu sector (benchmark) ---

  it('carga el benchmark con el periodo actual al inicializar', async () => {
    await crearComponente();

    expect(imaService.obtenerBenchmark).toHaveBeenCalledWith(ANIO_ACTUAL, MES_ACTUAL);
    expect((fixture.componentInstance as any).benchmarkData()).toBeTruthy();
    expect((fixture.componentInstance as any).benchmarkError()).toBe(false);
  });

  it('recarga el benchmark cuando cambia el periodo del IMA', async () => {
    await crearComponente();
    imaService.obtenerBenchmark.mockClear();

    (fixture.componentInstance as any).onImaPeriodoChange({ anio: 2026, mes: 3 });
    await fixture.whenStable();

    expect(imaService.obtenerBenchmark).toHaveBeenCalledWith(2026, 3);
  });

  it('muestra toast y activa error cuando falla el benchmark', async () => {
    imaService.obtenerBenchmark.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 500, error: { message: 'Sector no encontrado.' } })
      )
    );
    await crearComponente();

    expect((fixture.componentInstance as any).benchmarkError()).toBe(true);
    expect(toastService.error).toHaveBeenCalledWith('Sector no encontrado.', undefined, 5000);
  });

  it('usa el mensaje de respaldo cuando el error del benchmark no tiene detalle', async () => {
    imaService.obtenerBenchmark.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    await crearComponente();

    expect(toastService.error).toHaveBeenCalledWith(ERROR_BENCHMARK_MENSAJE, undefined, 5000);
  });
});
