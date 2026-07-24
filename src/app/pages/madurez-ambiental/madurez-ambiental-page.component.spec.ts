import { HttpErrorResponse } from '@angular/common/http';
import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { SesionInactividadService } from '../../core/auth/sesion-inactividad.service';
import { AuthSessionService } from '../../core/auth-session.service';
import { ToastService } from '../../shared/services/toast.service';
import {
  ImaEvento,
  ImaService,
  ImaTendenciaPunto,
  ImaTendenciaResponse,
} from '../dashboard/ima.service';
import { ImaTendenciaChartComponent } from './ima-tendencia-chart.component';
import {
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

const SERIE_CON_DATOS: ImaTendenciaPunto[] = [
  { mes: '2026-04', imaEmpresa: null, imaPromedioSector: null },
  { mes: '2026-05', imaEmpresa: 68, imaPromedioSector: 63.5 },
  { mes: '2026-06', imaEmpresa: 71, imaPromedioSector: 64 },
];

const SERIE_SIN_HISTORIAL: ImaTendenciaPunto[] = [
  { mes: '2026-05', imaEmpresa: null, imaPromedioSector: null },
  { mes: '2026-06', imaEmpresa: null, imaPromedioSector: null },
];

describe('MadurezAmbientalPageComponent', () => {
  let fixture: ComponentFixture<MadurezAmbientalPageComponent>;
  let imaService: { obtenerTendencia: ReturnType<typeof vi.fn> };
  let toastService: { error: ReturnType<typeof vi.fn> };

  const respuesta = (
    serie: ImaTendenciaPunto[],
    sinDatosSectoriales = false
  ): ImaTendenciaResponse => ({ mesesAtras: 12, serie, sinDatosSectoriales, eventos: [] });

  const html = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  async function crearComponente(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [MadurezAmbientalPageComponent],
      providers: [
        provideRouter([]),
        { provide: ImaService, useValue: imaService },
        { provide: AuthService, useValue: { token: signal('fake-token'), cerrarSesion: vi.fn() } },
        { provide: SesionInactividadService, useValue: { reiniciar: vi.fn(), detener: vi.fn() } },
        { provide: AuthSessionService, useValue: { getUserInitials: vi.fn(() => 'AJ') } },
        { provide: ToastService, useValue: toastService },
      ],
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
      obtenerTendencia: vi.fn().mockReturnValue(of(respuesta(SERIE_CON_DATOS))),
    };
    toastService = { toasts: signal([]), error: vi.fn() } as never;
  });

  it('solicita la ventana de 12 meses por defecto al iniciar', async () => {
    await crearComponente();

    expect(imaService.obtenerTendencia).toHaveBeenCalledWith(12);
  });

  it('muestra el grafico cuando hay historial', async () => {
    await crearComponente();

    const grafico = (fixture.nativeElement as HTMLElement).querySelector('app-ima-tendencia-chart');
    expect(grafico).toBeTruthy();
    expect(html()).not.toContain(SIN_HISTORIAL_MENSAJE);
  });

  it('muestra el estado vacio cuando la empresa no tiene snapshots', async () => {
    imaService.obtenerTendencia.mockReturnValue(of(respuesta(SERIE_SIN_HISTORIAL)));
    await crearComponente();

    expect(html()).toContain(SIN_HISTORIAL_MENSAJE);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-ima-tendencia-chart')
    ).toBeFalsy();
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

    const select = (fixture.nativeElement as HTMLElement).querySelector('select');
    expect(select).toBeTruthy();
    (select as HTMLSelectElement).value = '6';
    select?.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(imaService.obtenerTendencia).toHaveBeenCalledWith(6);
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
});
