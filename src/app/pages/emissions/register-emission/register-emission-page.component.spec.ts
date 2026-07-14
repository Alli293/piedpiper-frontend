import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { of } from 'rxjs';
import { RegisterEmissionPageComponent } from './register-emission-page.component';
import { EmisionesService } from '../emisiones.service';
import { EmisionResponse } from '../models/emision.model';

const VALID_RESPONSE: EmisionResponse = {
  id: '1',
  categoria: 'ELECTRICIDAD',
  titulo: 'Planta de tueste',
  fechaActividad: '2026-07-01',
  electricityValue: 500,
  electricityUnit: 'kwh',
  carbonKg: 347,
  carbonMt: 0.347,
  factorEmisionId: 'factor-1',
  estimatedAt: '2026-07-01T00:00:00Z',
  createdAt: '2026-07-01T00:00:00Z',
};

describe('RegisterEmissionPageComponent', () => {
  let registrarElectricidad: ReturnType<typeof vi.fn>;
  let registrarVuelo: ReturnType<typeof vi.fn>;
  let listarEmisiones: ReturnType<typeof vi.fn>;
  let actualizarVuelo: ReturnType<typeof vi.fn>;
  let eliminarEmision: ReturnType<typeof vi.fn>;
  let storage: Storage;

  beforeEach(async () => {
    storage = createStorageMock();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('sessionStorage', createStorageMock());
    storage.setItem('carbonhub.token', 'test-token');
    registrarElectricidad = vi.fn();
    registrarVuelo = vi.fn();
    listarEmisiones = vi.fn().mockReturnValue(of([]));
    actualizarVuelo = vi.fn();
    eliminarEmision = vi.fn();

    await TestBed.configureTestingModule({
      imports: [RegisterEmissionPageComponent],
      providers: [
        provideLocationMocks(),
        {
          provide: EmisionesService,
          useValue: {
            registrarElectricidad,
            registrarVuelo,
            listarEmisiones,
            actualizarVuelo,
            eliminarEmision,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(RegisterEmissionPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function setInputValue(root: HTMLElement, selector: string, value: string): void {
    const element = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  function fillValidForm(root: HTMLElement): void {
    setInputValue(root, 'textarea', 'Planta de tueste');
    setInputValue(root, 'app-number-input input', '500');
    setInputValue(root, 'app-date-input input', '2026-07-01');
  }

  async function submitForm(fixture: ReturnType<typeof createFixture>): Promise<void> {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  }

  function clickCategory(root: HTMLElement, label: string): void {
    const button = Array.from(root.querySelectorAll('button')).find((item) =>
      item.textContent?.includes(label)
    );
    if (!button) throw new Error(`Category not found: ${label}`);
    button.click();
  }

  it('does not call the service when the amount is 0 (invalid form)', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    setInputValue(root, 'app-number-input input', '0');

    await submitForm(fixture);

    expect(registrarElectricidad).not.toHaveBeenCalled();
  });

  it('calls the service exactly once when the form is valid', async () => {
    registrarElectricidad.mockReturnValue(of(VALID_RESPONSE));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    await submitForm(fixture);

    expect(registrarElectricidad).toHaveBeenCalledTimes(1);
    expect(registrarElectricidad).toHaveBeenCalledWith({
      titulo: 'Planta de tueste',
      electricityValue: 500,
      electricityUnit: 'kwh',
      fechaActividad: '2026-07-01',
    });
  });

  it('does not call the flight service without legs', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    clickCategory(root, 'Vuelos');
    fixture.detectChanges();
    const removeButton = Array.from(root.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Eliminar')
    );
    removeButton?.click();

    await submitForm(fixture);

    expect(registrarVuelo).not.toHaveBeenCalled();
  });

  it('calls the flight service with the expected body', async () => {
    registrarVuelo.mockReturnValue(of({ ...VALID_RESPONSE, categoria: 'VUELO', passengers: 2 }));
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    clickCategory(root, 'Vuelos');
    fixture.detectChanges();
    setInputValue(root, 'input[type="number"]', '2');
    setInputValue(root, 'input[type="date"]', '2026-07-01');
    const textInputs = root.querySelectorAll<HTMLInputElement>('input[type="text"]');
    textInputs[0].value = 'sfo';
    textInputs[0].dispatchEvent(new Event('input'));
    textInputs[1].value = 'yyz';
    textInputs[1].dispatchEvent(new Event('input'));

    await submitForm(fixture);

    expect(registrarVuelo).toHaveBeenCalledWith({
      passengers: 2,
      distanceUnit: 'km',
      fechaActividad: '2026-07-01',
      legs: [{ departureAirport: 'SFO', destinationAirport: 'YYZ', cabinClass: 'economy' }],
    });
  });
});

function createStorageMock(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}
