import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { SesionInactividadService } from '../../../core/auth/sesion-inactividad.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { ToastService } from '../../../shared/services/toast.service';
import { EmisionesService } from '../emisiones.service';
import { EmisionResponse } from '../models/emision.model';
import { EmissionsListPageComponent } from './emissions-list-page.component';

const REGISTRO_FLOTA: EmisionResponse = {
  id: 'registro-1',
  categoria: 'FLOTA',
  titulo: 'Ruta de reparto',
  fechaActividad: '2026-07-01',
  tipoVehiculo: 'AUTOMOVIL',
  combustible: 'GASOLINA',
  distanceValue: 100,
  distanceUnit: 'km',
  carbonKg: 21,
  carbonMt: 0.021,
  factorEmisionId: 'factor-1',
  estimatedAt: '2026-07-01T00:00:00Z',
  createdAt: '2026-07-01T00:00:00Z',
};

const REGISTRO_VUELO: EmisionResponse = {
  ...REGISTRO_FLOTA,
  id: 'registro-2',
  categoria: 'VUELO',
  titulo: 'Viaje aereo SJO-FRA-SJO',
  passengers: 2,
  legs: [
    { departureAirport: 'SJO', destinationAirport: 'FRA', cabinClass: 'economy' },
    { departureAirport: 'FRA', destinationAirport: 'SJO', cabinClass: 'economy' },
  ],
  carbonKg: 4689.988,
};

const REGISTRO_ELECTRICIDAD: EmisionResponse = {
  ...REGISTRO_FLOTA,
  id: 'registro-3',
  categoria: 'ELECTRICIDAD',
  titulo: 'Pruebas',
  electricityValue: 0.02,
  electricityUnit: 'kwh',
  carbonKg: 0.266,
};

const REGISTRO_FLOTA_OTRO_MES: EmisionResponse = {
  ...REGISTRO_FLOTA,
  id: 'registro-4',
  titulo: 'Ruta fuera de mes',
  fechaActividad: '2026-08-01',
};

describe('EmissionsListPageComponent', () => {
  let listarEmisiones: ReturnType<typeof vi.fn>;
  let eliminarEmision: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    listarEmisiones = vi.fn().mockReturnValue(of([REGISTRO_FLOTA]));
    eliminarEmision = vi.fn().mockReturnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [EmissionsListPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: EmisionesService,
          useValue: {
            listarEmisiones,
            eliminarEmision,
          },
        },
        {
          provide: AuthService,
          useValue: { token: signal('fake-token'), cerrarSesion: vi.fn() },
        },
        {
          provide: SesionInactividadService,
          useValue: { reiniciar: vi.fn(), detener: vi.fn() },
        },
        { provide: ToastService, useValue: { toasts: signal([]), error: vi.fn() } as any },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();

    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  async function createFixture() {
    const fixture = TestBed.createComponent(EmissionsListPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    return fixture;
  }

  function clickModalButton(root: HTMLElement, label: string): void {
    const button = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((item) =>
      item.textContent?.includes(label)
    );
    if (!button) throw new Error(`Modal button not found: ${label}`);
    button.click();
  }

  it('al confirmar el modal invoca eliminar', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-emissions-list-page__delete')?.click();
    fixture.detectChanges();

    clickModalButton(root, 'Eliminar');
    await fixture.whenStable();

    expect(eliminarEmision).toHaveBeenCalledWith('registro-1');
  });

  it('al cancelar el modal no invoca eliminar', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-emissions-list-page__delete')?.click();
    fixture.detectChanges();

    clickModalButton(root, 'Cancelar');
    await fixture.whenStable();

    expect(eliminarEmision).not.toHaveBeenCalled();
  });

  it('cierra el modal al hacer click en el fondo', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-emissions-list-page__delete')?.click();
    fixture.detectChanges();

    root.querySelector<HTMLElement>('.ch-emissions-list-page__modal-backdrop')?.click();
    fixture.detectChanges();

    expect(root.querySelector('.ch-emissions-list-page__modal')).toBeNull();
    expect(eliminarEmision).not.toHaveBeenCalled();
  });

  it('cierra el modal con Escape', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.ch-emissions-list-page__delete')?.click();
    fixture.detectChanges();

    root
      .querySelector<HTMLElement>('.ch-emissions-list-page__modal')
      ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(root.querySelector('.ch-emissions-list-page__modal')).toBeNull();
    expect(eliminarEmision).not.toHaveBeenCalled();
  });

  it('navega a limites anuales desde el boton del toolbar', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    const limitsButton = root.querySelector<HTMLButtonElement>(
      '.ch-emissions-list-page__header-actions button'
    );

    limitsButton?.click();

    expect(navigateByUrl).toHaveBeenCalledWith('/empresa/limites');
  });

  it('navega al dashboard desde el sidebar', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    const dashboardButton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Dashboard')
    );

    dashboardButton?.click();

    expect(navigateByUrl).toHaveBeenCalledWith('/empresa/panel');
  });

  it('mantiene los contadores del periodo aunque se filtre por categoria', async () => {
    const registros = [REGISTRO_ELECTRICIDAD, REGISTRO_FLOTA, REGISTRO_VUELO];
    listarEmisiones.mockReturnValue(of(registros));
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const vuelosChip = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item')
    ).find((button) => button.textContent?.includes('Vuelos'));
    vuelosChip?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(root.textContent).toContain('Todas3');
    expect(root.textContent).toContain('Flota1');
    expect(root.textContent).toContain('Vuelos1');
    expect(root.textContent).toContain('Viaje aereo SJO-FRA-SJO');
    expect(root.textContent).not.toContain('Ruta de reparto');
  });

  it('ignora respuestas viejas para no pisar el filtro de flota', async () => {
    const registros = [REGISTRO_ELECTRICIDAD, REGISTRO_FLOTA, REGISTRO_VUELO];
    const cargaInicial = new Subject<EmisionResponse[]>();
    let llamadas = 0;
    listarEmisiones.mockImplementation(() => {
      llamadas += 1;
      if (llamadas === 1) return cargaInicial.asObservable();
      return of(registros);
    });

    const fixture = TestBed.createComponent(EmissionsListPageComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const flotaChip = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item')
    ).find((button) => button.textContent?.includes('Flota'));

    flotaChip?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    cargaInicial.next(registros);
    cargaInicial.complete();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const tableText = root.querySelector('tbody')?.textContent ?? '';
    expect(tableText).toContain('Ruta de reparto');
    expect(tableText).not.toContain('Pruebas');
    expect(tableText).not.toContain('Viaje aereo SJO-FRA-SJO');
    expect(listarEmisiones).toHaveBeenLastCalledWith();
  });

  it('filtra en pantalla por categoria aunque el servicio devuelva todos los registros', async () => {
    const registros = [REGISTRO_ELECTRICIDAD, REGISTRO_FLOTA, REGISTRO_VUELO];
    listarEmisiones.mockReturnValue(of(registros));
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const flotaChip = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.ch-filter-chips__item')
    ).find((button) => button.textContent?.includes('Flota'));
    flotaChip?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const tableText = root.querySelector('tbody')?.textContent ?? '';
    expect(tableText).toContain('Ruta de reparto');
    expect(tableText).not.toContain('Pruebas');
    expect(tableText).not.toContain('Viaje aereo SJO-FRA-SJO');
  });

  it('filtra en pantalla por año y mes aunque el servicio devuelva mas registros', async () => {
    listarEmisiones.mockReturnValue(of([REGISTRO_FLOTA, REGISTRO_FLOTA_OTRO_MES]));
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;
    const selects = root.querySelectorAll<HTMLSelectElement>('app-select-input select');

    selects[0].value = '2026';
    selects[0].dispatchEvent(new Event('change'));
    selects[1].value = '7';
    selects[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const tableText = root.querySelector('tbody')?.textContent ?? '';
    expect(tableText).toContain('Ruta de reparto');
    expect(tableText).not.toContain('Ruta fuera de mes');
  });
});
