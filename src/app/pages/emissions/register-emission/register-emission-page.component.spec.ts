import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterEmissionPageComponent } from './register-emission-page.component';
import { EmisionesService } from '../emisiones.service';
import { EmisionFlotaResponse, EmisionResponse, TipoVehiculoOption } from '../models/emision.model';

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

const FLIGHT_RESPONSE: EmisionResponse = {
  ...VALID_RESPONSE,
  id: 'flight-1',
  categoria: 'VUELO',
  titulo: 'Viaje aéreo SFO-YYZ',
  passengers: 2,
  legs: [{ departureAirport: 'SFO', destinationAirport: 'YYZ', cabinClass: 'economy' }],
  distanceUnit: 'km',
  distanceValue: 7200,
};

const TIPOS_VEHICULO: TipoVehiculoOption[] = [
  {
    id: 'AUTOMOVIL',
    nombre: 'Automóvil / SUV',
    combustibles: [
      { id: 'PROMEDIO', nombre: 'Promedio' },
      { id: 'GASOLINA', nombre: 'Gasolina' },
      { id: 'BEV', nombre: 'Eléctrico (BEV)' },
    ],
  },
  {
    id: 'MOTOCICLETA',
    nombre: 'Motocicleta',
    combustibles: [
      { id: 'PROMEDIO', nombre: 'Promedio' },
      { id: 'GASOLINA', nombre: 'Gasolina' },
    ],
  },
];

const VALID_FLOTA_RESPONSE: EmisionFlotaResponse = {
  id: '2',
  categoria: 'FLOTA',
  titulo: 'Ruta de reparto',
  fechaActividad: '2026-07-01',
  tipoVehiculo: 'AUTOMOVIL',
  combustible: 'GASOLINA',
  distanceValue: 100,
  distanceUnit: 'km',
  carbonKg: 21,
  carbonMt: 0.021,
  factorEmisionId: 'factor-2',
  estimatedAt: '2026-07-01T00:00:00Z',
  createdAt: '2026-07-01T00:00:00Z',
};

describe('RegisterEmissionPageComponent', () => {
  let registrarElectricidad: ReturnType<typeof vi.fn>;
  let registrarVuelo: ReturnType<typeof vi.fn>;
  let listarEmisiones: ReturnType<typeof vi.fn>;
  let actualizarVuelo: ReturnType<typeof vi.fn>;
  let eliminarEmision: ReturnType<typeof vi.fn>;
  let obtenerTiposVehiculo: ReturnType<typeof vi.fn>;
  let registrarFlota: ReturnType<typeof vi.fn>;
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
    eliminarEmision = vi.fn().mockReturnValue(of(void 0));
    obtenerTiposVehiculo = vi.fn().mockReturnValue(of(TIPOS_VEHICULO));
    registrarFlota = vi.fn();

    await TestBed.configureTestingModule({
      imports: [RegisterEmissionPageComponent],
      providers: [
        provideLocationMocks(),
        provideRouter([]),
        {
          provide: EmisionesService,
          useValue: {
            registrarElectricidad,
            registrarVuelo,
            listarEmisiones,
            actualizarVuelo,
            eliminarEmision,
            obtenerTiposVehiculo,
            registrarFlota,
          },
        },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
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
    const element = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      selector
    );
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.value = value;
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input'));
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
    clickButton(root, label, 'Category');
  }

  function clickButton(root: HTMLElement, label: string, errorLabel = 'Button'): void {
    const button = Array.from(root.querySelectorAll('button')).find((item) =>
      item.textContent?.includes(label)
    );
    if (!button) throw new Error(`${errorLabel} not found: ${label}`);
    button.click();
  }

  function clickRecordButton(root: HTMLElement, label: string): void {
    const button = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.register-emission-page__record-actions button')
    ).find((item) => item.textContent?.includes(label));
    if (!button) throw new Error(`Record button not found: ${label}`);
    button.click();
  }

  function selectFlotaTab(fixture: ReturnType<typeof createFixture>): HTMLElement {
    const root = fixture.nativeElement as HTMLElement;
    clickCategory(root, 'Flota vehicular');
    fixture.detectChanges();
    return root;
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

  it('does not show flight records while electricity is selected', async () => {
    listarEmisiones.mockReturnValue(of([FLIGHT_RESPONSE]));
    const fixture = createFixture();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).not.toContain('Vuelos registrados');
    expect(root.textContent).not.toContain('Viaje aéreo SFO-YYZ');
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

  it('loads the date when editing a flight', async () => {
    listarEmisiones.mockReturnValue(of([FLIGHT_RESPONSE]));
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    clickCategory(root, 'Vuelos');
    await fixture.whenStable();
    fixture.detectChanges();

    clickButton(root, 'Editar');
    fixture.detectChanges();

    const dateInput = root.querySelector<HTMLInputElement>('input[type="date"]');
    expect(dateInput?.value).toBe('2026-07-01');
  });

  it('keeps the edit flow stable when updating a flight fails', async () => {
    listarEmisiones.mockReturnValue(of([FLIGHT_RESPONSE]));
    actualizarVuelo.mockReturnValue(throwError(() => new Error('Network error')));
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    clickCategory(root, 'Vuelos');
    await fixture.whenStable();
    fixture.detectChanges();

    clickButton(root, 'Editar');
    await submitForm(fixture);

    expect(actualizarVuelo).toHaveBeenCalledWith('flight-1', {
      passengers: 2,
      distanceUnit: 'km',
      fechaActividad: '2026-07-01',
      legs: [{ departureAirport: 'SFO', destinationAirport: 'YYZ', cabinClass: 'economy' }],
    });
  });

  it('asks for confirmation before deleting an emission', async () => {
    listarEmisiones.mockReturnValue(of([FLIGHT_RESPONSE]));
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    clickCategory(root, 'Vuelos');
    await fixture.whenStable();
    fixture.detectChanges();

    clickRecordButton(root, 'Eliminar');
    await fixture.whenStable();

    expect(globalThis.confirm).toHaveBeenCalled();
    expect(eliminarEmision).toHaveBeenCalledWith('flight-1');
  });

  it('does not delete when confirmation is cancelled', async () => {
    listarEmisiones.mockReturnValue(of([FLIGHT_RESPONSE]));
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    );
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    clickCategory(root, 'Vuelos');
    await fixture.whenStable();
    fixture.detectChanges();

    clickRecordButton(root, 'Eliminar');
    await fixture.whenStable();

    expect(eliminarEmision).not.toHaveBeenCalled();
  });

  it('does not submit without an active session', async () => {
    storage.removeItem('carbonhub.token');
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    await submitForm(fixture);

    expect(registrarElectricidad).not.toHaveBeenCalled();
  });

  it('shows the empty state when loading emissions fails', async () => {
    listarEmisiones.mockReturnValue(throwError(() => new Error('Network error')));
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    clickCategory(root, 'Vuelos');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.textContent).toContain('No hay vuelos registrados.');
  });

  describe('flota vehicular', () => {
    it('fetches the vehicle catalog and renders the flota fields when the tab is selected', () => {
      const fixture = createFixture();
      const root = selectFlotaTab(fixture);

      expect(obtenerTiposVehiculo).toHaveBeenCalledTimes(1);
      const selects = root.querySelectorAll('app-select-input select');
      expect(selects.length).toBe(2);
    });

    it('updates the combustible options when the vehicle type changes and clears an invalid selection', () => {
      const fixture = createFixture();
      const root = selectFlotaTab(fixture);

      const [tipoSelect, combustibleSelect] = Array.from(
        root.querySelectorAll<HTMLSelectElement>('app-select-input select')
      );

      tipoSelect.value = 'AUTOMOVIL';
      tipoSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      let combustibleOptionValues = Array.from(combustibleSelect.options).map((o) => o.value);
      expect(combustibleOptionValues).toEqual(
        expect.arrayContaining(['PROMEDIO', 'GASOLINA', 'BEV'])
      );

      combustibleSelect.value = 'BEV';
      combustibleSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      tipoSelect.value = 'MOTOCICLETA';
      tipoSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      combustibleOptionValues = Array.from(combustibleSelect.options).map((o) => o.value);
      expect(combustibleOptionValues).not.toContain('BEV');
      expect(combustibleSelect.value).not.toBe('BEV');
    });

    it('does not call registrarFlota when the distance is 0 (invalid form)', async () => {
      const fixture = createFixture();
      const root = selectFlotaTab(fixture);

      const [tipoSelect, combustibleSelect] = Array.from(
        root.querySelectorAll<HTMLSelectElement>('app-select-input select')
      );
      tipoSelect.value = 'AUTOMOVIL';
      tipoSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      combustibleSelect.value = 'GASOLINA';
      combustibleSelect.dispatchEvent(new Event('change'));

      setInputValue(root, 'app-number-input input', '0');
      setInputValue(root, 'app-date-input input', '2026-07-01');
      setInputValue(root, 'textarea', 'Ruta de reparto');

      await submitForm(fixture);

      expect(registrarFlota).not.toHaveBeenCalled();
    });

    it('calls registrarFlota with the expected payload and navigates on success', async () => {
      registrarFlota.mockReturnValue(of(VALID_FLOTA_RESPONSE));

      const fixture = createFixture();
      const root = selectFlotaTab(fixture);

      const [tipoSelect, combustibleSelect] = Array.from(
        root.querySelectorAll<HTMLSelectElement>('app-select-input select')
      );
      tipoSelect.value = 'AUTOMOVIL';
      tipoSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      combustibleSelect.value = 'GASOLINA';
      combustibleSelect.dispatchEvent(new Event('change'));

      setInputValue(root, 'app-number-input input', '100');
      setInputValue(root, 'app-date-input input', '2026-07-01');
      setInputValue(root, 'textarea', 'Ruta de reparto');

      await submitForm(fixture);

      expect(registrarFlota).toHaveBeenCalledTimes(1);
      expect(registrarFlota).toHaveBeenCalledWith({
        titulo: 'Ruta de reparto',
        tipoVehiculo: 'AUTOMOVIL',
        combustible: 'GASOLINA',
        distanceValue: 100,
        distanceUnit: 'km',
        fechaActividad: '2026-07-01',
      });
      expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/emisiones');
    });

    it('shows a retry action when the vehicle catalog fails to load', () => {
      obtenerTiposVehiculo.mockReturnValue(throwError(() => new Error('network error')));

      const fixture = createFixture();
      const root = selectFlotaTab(fixture);

      const retryButton = Array.from(root.querySelectorAll('app-button')).find((el) =>
        el.textContent?.includes('Reintentar')
      );
      expect(retryButton).toBeTruthy();
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
