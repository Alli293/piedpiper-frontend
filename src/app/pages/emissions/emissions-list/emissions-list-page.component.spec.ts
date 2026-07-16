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
});
