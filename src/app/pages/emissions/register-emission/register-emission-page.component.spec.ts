import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterEmissionPageComponent } from './register-emission-page.component';
import { EmisionesService } from '../emisiones.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import {
  EmisionEnvioResponse,
  EmisionFlotaResponse,
  EmisionResponse,
  TipoVehiculoOption,
} from '../models/emision.model';
import { seleccionarFechaDeInput } from '../../../shared/components/inputs/date-input/date-input.testing';

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

const VALID_ENVIO_RESPONSE: EmisionEnvioResponse = {
  id: '3',
  categoria: 'ENVIO',
  titulo: 'Envío de café a puerto',
  fechaActividad: '2026-07-01',
  weightValue: 200,
  weightUnit: 'KG',
  distanceValue: 500,
  distanceUnit: 'km',
  transportMethod: 'TRUCK',
  carbonKg: 35.5,
  carbonMt: 0.036,
  factorEmisionId: 'factor-envio-1',
  estimatedAt: '2026-07-01T00:00:00Z',
  createdAt: '2026-07-01T00:00:00Z',
};

describe('RegisterEmissionPageComponent', () => {
  let registrarElectricidad: ReturnType<typeof vi.fn>;
  let registrarVuelo: ReturnType<typeof vi.fn>;
  let obtenerTiposVehiculo: ReturnType<typeof vi.fn>;
  let registrarFlota: ReturnType<typeof vi.fn>;
  let registrarEnvio: ReturnType<typeof vi.fn>;
  let storage: Storage;
  let toastError: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    storage = createStorageMock();
    vi.stubGlobal('sessionStorage', storage);
    vi.stubGlobal('localStorage', createStorageMock());
    storage.setItem('carbonhub.token', 'test-token');
    registrarElectricidad = vi.fn();
    registrarVuelo = vi.fn();
    obtenerTiposVehiculo = vi.fn().mockReturnValue(of(TIPOS_VEHICULO));
    registrarFlota = vi.fn();
    registrarEnvio = vi.fn();

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
            obtenerTiposVehiculo,
            registrarFlota,
            registrarEnvio,
          },
        },
        {
          provide: PerfilInicialService,
          useValue: { perfil: () => null, obtener: () => of({ empresa: null } as PerfilInicial) },
        },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    toastError = vi.spyOn(TestBed.inject(ToastService), 'error');
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

  function fillValidForm(fixture: ReturnType<typeof createFixture>): void {
    const root = fixture.nativeElement as HTMLElement;
    setInputValue(root, 'textarea', 'Planta de tueste');
    setInputValue(root, 'app-number-input input', '500');
    seleccionarFechaDeInput(fixture, new Date(Date.UTC(2026, 6, 1)));
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

  function selectTab(fixture: ReturnType<typeof createFixture>, label: string): HTMLElement {
    const root = fixture.nativeElement as HTMLElement;
    clickCategory(root, label);
    fixture.detectChanges();
    return root;
  }

  function selectFlotaTab(fixture: ReturnType<typeof createFixture>): HTMLElement {
    return selectTab(fixture, 'Flota vehicular');
  }

  function selectEnvioTab(fixture: ReturnType<typeof createFixture>): HTMLElement {
    return selectTab(fixture, 'Envíos de carga');
  }

  function clickRetry(root: HTMLElement): void {
    const retryButton = Array.from(root.querySelectorAll('app-button')).find((el) =>
      el.textContent?.includes('Reintentar')
    );
    if (!retryButton) throw new Error('Retry button not found');
    retryButton.querySelector('button')?.click();
  }

  function selectElectricidadTab(fixture: ReturnType<typeof createFixture>): HTMLElement {
    return selectTab(fixture, 'Electricidad');
  }

  it('does not call the service when the amount is 0 (invalid form)', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(fixture);
    setInputValue(root, 'app-number-input input', '0');

    await submitForm(fixture);

    expect(registrarElectricidad).not.toHaveBeenCalled();
  });

  it('navigates to dashboard from the sidebar menu', () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    clickButton(root, 'Dashboard');

    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/empresa/panel');
  });

  it('calls the service exactly once when the form is valid', async () => {
    registrarElectricidad.mockReturnValue(of(VALID_RESPONSE));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(fixture);
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
    seleccionarFechaDeInput(fixture, new Date(Date.UTC(2026, 6, 1)));
    const textInputs = root.querySelectorAll<HTMLInputElement>(
      'input[type="text"]:not(.ch-date-input__field)'
    );
    textInputs[0].value = 'sfo';
    textInputs[0].dispatchEvent(new Event('input'));
    textInputs[1].value = 'yyz';
    textInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    clickButton(root, 'Agregar vuelta');

    await submitForm(fixture);

    expect(registrarVuelo).toHaveBeenCalledWith({
      passengers: 2,
      distanceUnit: 'km',
      fechaActividad: '2026-07-01',
      legs: [
        { departureAirport: 'SFO', destinationAirport: 'YYZ', cabinClass: 'economy' },
        { departureAirport: 'YYZ', destinationAirport: 'SFO', cabinClass: 'economy' },
      ],
    });
  });

  it('adds one return leg and disables the return action for a completed round trip', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    clickCategory(root, 'Vuelos');
    fixture.detectChanges();

    const textInputs = root.querySelectorAll<HTMLInputElement>(
      'input[type="text"]:not(.ch-date-input__field)'
    );
    textInputs[0].value = 'sfo';
    textInputs[0].dispatchEvent(new Event('input'));
    textInputs[1].value = 'yyz';
    textInputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    clickButton(root, 'Agregar vuelta');
    fixture.detectChanges();

    const roundTripInputs = root.querySelectorAll<HTMLInputElement>(
      'input[type="text"]:not(.ch-date-input__field)'
    );
    expect(root.querySelectorAll('.register-emission-page__leg')).toHaveLength(2);
    expect(roundTripInputs[2].value).toBe('YYZ');
    expect(roundTripInputs[3].value).toBe('SFO');

    const returnButton = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.includes('Agregar vuelta')
    );
    expect(returnButton?.disabled).toBe(true);
    returnButton?.click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.register-emission-page__leg')).toHaveLength(2);
  });

  it('does not submit without an active session', async () => {
    storage.removeItem('carbonhub.token');
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(fixture);
    await submitForm(fixture);

    expect(registrarElectricidad).not.toHaveBeenCalled();
  });

  describe('flota vehicular', () => {
    it('does not fetch the vehicle catalog while the electricidad tab is active', () => {
      createFixture();

      expect(obtenerTiposVehiculo).not.toHaveBeenCalled();
    });

    it('fetches the vehicle catalog and renders the flota fields when the tab is selected', () => {
      const fixture = createFixture();
      const root = selectFlotaTab(fixture);

      expect(obtenerTiposVehiculo).toHaveBeenCalledTimes(1);
      const selects = root.querySelectorAll('app-select-input select');
      expect(selects.length).toBe(2);
    });

    it('does not refetch the vehicle catalog when the flota tab is selected again', () => {
      const fixture = createFixture();
      selectFlotaTab(fixture);
      selectElectricidadTab(fixture);
      selectFlotaTab(fixture);

      expect(obtenerTiposVehiculo).toHaveBeenCalledTimes(1);
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
      seleccionarFechaDeInput(fixture, new Date(Date.UTC(2026, 6, 1)));
      setInputValue(root, 'textarea', 'Ruta de reparto');

      await submitForm(fixture);

      expect(registrarFlota).not.toHaveBeenCalled();
    });

    it('does not call registrarFlota without an active session', async () => {
      storage.removeItem('carbonhub.token');

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
      seleccionarFechaDeInput(fixture, new Date(Date.UTC(2026, 6, 1)));
      setInputValue(root, 'textarea', 'Ruta de reparto');

      await submitForm(fixture);

      expect(registrarFlota).not.toHaveBeenCalled();
    });

    it('calls registrarFlota with the expected payload and resets the form on success', async () => {
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
      seleccionarFechaDeInput(fixture, new Date(Date.UTC(2026, 6, 1)));
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
      expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalledWith('/empresa/emisiones');
      fixture.detectChanges();
      expect(root.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe('');
    });

    it('refetches the vehicle catalog when the retry action is clicked after a failure', () => {
      obtenerTiposVehiculo.mockReturnValue(throwError(() => new Error('network error')));

      const fixture = createFixture();
      const root = selectFlotaTab(fixture);

      expect(root.textContent).toContain('No se pudo cargar el catálogo de vehículos');
      expect(obtenerTiposVehiculo).toHaveBeenCalledTimes(1);

      obtenerTiposVehiculo.mockReturnValue(of(TIPOS_VEHICULO));
      clickRetry(root);
      fixture.detectChanges();

      expect(obtenerTiposVehiculo).toHaveBeenCalledTimes(2);
      expect(root.textContent).not.toContain('No se pudo cargar el catálogo de vehículos');
      const [tipoSelect] = Array.from(
        root.querySelectorAll<HTMLSelectElement>('app-select-input select')
      );
      expect(Array.from(tipoSelect.options).map((o) => o.value)).toEqual(
        expect.arrayContaining(['AUTOMOVIL', 'MOTOCICLETA'])
      );
    });

    it('shows the session message instead of the generic catalog error on a 401', () => {
      obtenerTiposVehiculo.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
      );

      const fixture = createFixture();
      const root = selectFlotaTab(fixture);

      expect(root.textContent).toContain('Tu sesión no tiene permisos');
      expect(root.textContent).not.toContain('No se pudo cargar el catálogo de vehículos');
    });

    it('does not raise an error toast when the vehicle catalog fails to load', () => {
      obtenerTiposVehiculo.mockReturnValue(throwError(() => new Error('network error')));

      const fixture = createFixture();
      selectFlotaTab(fixture);

      expect(toastError).not.toHaveBeenCalled();
    });
  });

  describe('envío de carga', () => {
    function fillValidEnvioForm(fixture: ReturnType<typeof createFixture>): void {
      const root = fixture.nativeElement as HTMLElement;
      setInputValue(root, 'textarea', 'Envío de café a puerto');
      const numberInputs = root.querySelectorAll<HTMLInputElement>('app-number-input input');
      numberInputs[0].value = '200';
      numberInputs[0].dispatchEvent(new Event('input'));
      numberInputs[1].value = '500';
      numberInputs[1].dispatchEvent(new Event('input'));
      seleccionarFechaDeInput(fixture, new Date(Date.UTC(2026, 6, 1)));
    }

    it('does not call the service when weight is 0 (invalid form)', async () => {
      const fixture = createFixture();
      const root = selectEnvioTab(fixture);

      fillValidEnvioForm(fixture);
      const numberInputs = root.querySelectorAll<HTMLInputElement>('app-number-input input');
      numberInputs[0].value = '0';
      numberInputs[0].dispatchEvent(new Event('input'));

      await submitForm(fixture);

      expect(registrarEnvio).not.toHaveBeenCalled();
    });

    it('calls registrarEnvio with the expected payload and resets the form on success', async () => {
      registrarEnvio.mockReturnValue(of(VALID_ENVIO_RESPONSE));

      const fixture = createFixture();
      const root = selectEnvioTab(fixture);

      fillValidEnvioForm(fixture);
      await submitForm(fixture);

      expect(registrarEnvio).toHaveBeenCalledTimes(1);
      expect(registrarEnvio).toHaveBeenCalledWith({
        titulo: 'Envío de café a puerto',
        weightValue: 200,
        weightUnit: 'KG',
        distanceValue: 500,
        distanceUnit: 'km',
        transportMethod: 'TRUCK',
        fechaActividad: '2026-07-01',
      });
      expect(TestBed.inject(Router).navigateByUrl).not.toHaveBeenCalledWith('/empresa/emisiones');
      fixture.detectChanges();
      expect(root.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe('');
    });

    it('does not call registrarEnvio without an active session', async () => {
      storage.removeItem('carbonhub.token');

      const fixture = createFixture();
      const root = selectEnvioTab(fixture);

      fillValidEnvioForm(fixture);
      await submitForm(fixture);

      expect(registrarEnvio).not.toHaveBeenCalled();
    });

    it('shows session error toast on 401 response', async () => {
      registrarEnvio.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
      );

      const fixture = createFixture();
      const root = selectEnvioTab(fixture);

      fillValidEnvioForm(fixture);
      await submitForm(fixture);

      expect(toastError).toHaveBeenCalledWith(expect.stringContaining('sesión'));
    });

    it('shows the API error message when the backend returns one', async () => {
      registrarEnvio.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 422,
              statusText: 'Unprocessable Entity',
              error: { status: 422, message: 'El peso excede el límite permitido.' },
            })
        )
      );

      const fixture = createFixture();
      const root = selectEnvioTab(fixture);

      fillValidEnvioForm(fixture);
      await submitForm(fixture);

      expect(toastError).toHaveBeenCalledWith('El peso excede el límite permitido.');
    });

    it('shows the generic connection error on an unknown failure', async () => {
      registrarEnvio.mockReturnValue(throwError(() => new Error('Network error')));

      const fixture = createFixture();
      const root = selectEnvioTab(fixture);

      fillValidEnvioForm(fixture);
      await submitForm(fixture);

      expect(toastError).toHaveBeenCalledWith(expect.stringContaining('No se pudo conectar'));
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
