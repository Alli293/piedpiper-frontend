import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe('EmissionsListPageComponent', () => {
  let listarEmisiones: ReturnType<typeof vi.fn>;
  let eliminarEmision: ReturnType<typeof vi.fn>;

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
      ],
    }).compileComponents();
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

    root.querySelector<HTMLButtonElement>('.emissions-list-page__delete')?.click();
    fixture.detectChanges();

    clickModalButton(root, 'Eliminar');
    await fixture.whenStable();

    expect(eliminarEmision).toHaveBeenCalledWith('registro-1');
  });

  it('al cancelar el modal no invoca eliminar', async () => {
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('.emissions-list-page__delete')?.click();
    fixture.detectChanges();

    clickModalButton(root, 'Cancelar');
    await fixture.whenStable();

    expect(eliminarEmision).not.toHaveBeenCalled();
  });

  it('mantiene los contadores del periodo aunque se filtre por categoria', async () => {
    const registros = [REGISTRO_ELECTRICIDAD, REGISTRO_FLOTA, REGISTRO_VUELO];
    listarEmisiones.mockImplementation((filtros) =>
      of(filtros?.categoria === 'VUELO' ? [REGISTRO_VUELO] : registros)
    );
    const fixture = await createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const vuelosChip = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.emissions-list-page__chip')
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
});
