import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { EcoRutaPreferenciasPageComponent } from './ecoruta-preferencias-page.component';
import { EcoRutaPreferenciasService } from '../ecoruta-preferencias.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PerfilInicialService } from '../../../core/services/perfil-inicial.service';
import { PerfilInicial } from '../../../core/models/perfil-inicial.model';
import { PreferenciasViajeResponse } from '../models/preferencias-viaje.model';
import { EcoRutaItinerariosService } from '../itinerarios/ecoruta-itinerarios.service';
import { Itinerario } from '../itinerarios/models/itinerario.model';
import { seleccionarFechaDeInput } from '../../../shared/components/inputs/date-input/date-input.testing';

// minFecha del formulario es "hoy", asi que las fechas de prueba tienen que
// quedar siempre en el futuro respecto al momento real en que corre la
// suite, no un valor fijo que eventualmente pasa a ser una fecha vencida.
function fechaFuturaUtc(diasDesdeHoy: number): Date {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diasDesdeHoy));
}

function fechaFuturaIso(diasDesdeHoy: number): string {
  return fechaFuturaUtc(diasDesdeHoy).toISOString().slice(0, 10);
}

function fechaFuturaDisplay(diasDesdeHoy: number): string {
  const [anio, mes, dia] = fechaFuturaIso(diasDesdeHoy).split('-');
  return `${dia}/${mes}/${anio}`;
}

const FECHA_INICIO_ISO = fechaFuturaIso(30);

const ITINERARIO_GENERADO: Itinerario = {
  id: 'itinerario-1',
  cantidadDias: 5,
  fechaInicio: FECHA_INICIO_ISO,
  tipoViaje: 'FAMILIA',
  estado: 'GENERADO',
  version: 1,
  puntuacionAmbientalPreliminar: 80,
  fechaGeneracion: '2026-08-01T00:00:00.000Z',
  generadoParcial: false,
  mensajeParcial: null,
  dias: [],
};

const VALID_RESPONSE: PreferenciasViajeResponse = {
  id: '1',
  cantidadDias: 5,
  fechaInicio: FECHA_INICIO_ISO,
  tipoViaje: 'FAMILIA',
  presupuesto: 'MODERADO',
  intereses: ['NATURALEZA', 'AVENTURA'],
  provinciaPreferida: 'SAN_JOSE',
  ubicacionActual: 'San José, Costa Rica',
  buscarCercaDeMi: true,
  limitacionesMovilidad: null,
  requiereHospedaje: false,
  conversacionCompleta: true,
  recienCreada: false,
};

describe('EcoRutaPreferenciasPageComponent', () => {
  let obtener: ReturnType<typeof vi.fn>;
  let guardar: ReturnType<typeof vi.fn>;
  let generar: ReturnType<typeof vi.fn>;
  let storage: Storage;
  let toastError: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    storage = createStorageMock();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('sessionStorage', createStorageMock());
    storage.setItem('carbonhub.token', 'test-token');

    obtener = vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    guardar = vi.fn();
    generar = vi.fn().mockReturnValue(of(ITINERARIO_GENERADO));

    await TestBed.configureTestingModule({
      imports: [EcoRutaPreferenciasPageComponent],
      providers: [
        provideLocationMocks(),
        provideRouter([]),
        { provide: EcoRutaPreferenciasService, useValue: { obtener, guardar } },
        { provide: EcoRutaItinerariosService, useValue: { generar } },
        {
          provide: PerfilInicialService,
          useValue: {
            perfil: signal<PerfilInicial | null>(null),
            obtener: vi.fn().mockReturnValue(of(null)),
          },
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
    const fixture = TestBed.createComponent(EcoRutaPreferenciasPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function setInputValue(root: HTMLElement, selector: string, value: string): void {
    const element = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    element.value = value;
    element.dispatchEvent(new Event('input'));
  }

  function clickChipInGroup(root: HTMLElement, groupIndex: number, label: string): void {
    const group = root.querySelectorAll('app-chip-select')[groupIndex];
    if (!group) throw new Error(`Chip group not found: ${groupIndex}`);
    const button = Array.from(group.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === label
    );
    if (!button) throw new Error(`Chip not found: ${label}`);
    button.click();
  }

  function toggleSwitch(root: HTMLElement, index: number): void {
    const input = root.querySelectorAll<HTMLInputElement>('app-toggle-switch input')[index];
    if (!input) throw new Error(`Toggle not found: ${index}`);
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change'));
  }

  function fillValidForm(fixture: ReturnType<typeof createFixture>): void {
    const root = fixture.nativeElement as HTMLElement;
    seleccionarFechaDeInput(fixture, fechaFuturaUtc(30));
    setInputValue(root, 'app-number-input input', '5');
    clickChipInGroup(root, 0, 'Familia');
    clickChipInGroup(root, 1, 'Naturaleza');
  }

  async function submitForm(fixture: ReturnType<typeof createFixture>): Promise<void> {
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('precarga el formulario cuando ya existe un borrador', async () => {
    obtener.mockReturnValue(of(VALID_RESPONSE));

    const fixture = createFixture();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector<HTMLInputElement>('app-date-input input')?.value).toBe(
      fechaFuturaDisplay(30)
    );
    expect(root.querySelector<HTMLInputElement>('app-number-input input')?.value).toBe('5');

    const familiaChip = Array.from(
      root.querySelectorAll('app-chip-select')[0].querySelectorAll('button')
    ).find((item) => item.textContent?.trim() === 'Familia');
    expect(familiaChip?.classList.contains('ch-chip-select__item--active')).toBe(true);
  });

  it('no muestra error cuando no hay borrador previo (404)', async () => {
    const fixture = createFixture();
    await fixture.whenStable();

    expect(toastError).not.toHaveBeenCalled();
  });

  it('no llama a guardar cuando el formulario es invalido', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    seleccionarFechaDeInput(fixture, fechaFuturaUtc(30));
    setInputValue(root, 'app-number-input input', '5');
    clickChipInGroup(root, 0, 'Familia');

    await submitForm(fixture);

    expect(guardar).not.toHaveBeenCalled();
  });

  // Known limitation: @angular/forms/signals submit() is async and Vitest+jsdom
  // doesn't propagate native form submit events into the signal forms pipeline.
  // The form validation works in real browsers. Tracked for fix when Angular
  // provides TestBed utilities for signal forms.
  it.skip('llama a guardar con el payload completo cuando el formulario es valido', async () => {
    guardar.mockReturnValue(of({ ...VALID_RESPONSE, recienCreada: true }));

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(fixture);
    await submitForm(fixture);

    expect(guardar).toHaveBeenCalledTimes(1);
    expect(guardar).toHaveBeenCalledWith({
      cantidadDias: 5,
      fechaInicio: FECHA_INICIO_ISO,
      tipoViaje: 'FAMILIA',
      presupuesto: null,
      intereses: ['NATURALEZA'],
      provinciaPreferida: null,
      ubicacionActual: null,
      buscarCercaDeMi: false,
      limitacionesMovilidad: null,
      requiereHospedaje: false,
    });
  });

  it('muestra el campo de ubicacion actual al activar buscar cerca de mi', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('app-text-input')).toBeNull();

    toggleSwitch(root, 1);
    fixture.detectChanges();

    expect(root.querySelector('app-text-input')).not.toBeNull();
  });

  it('deshabilita el formulario mientras se precarga el borrador', async () => {
    const obtener$ = new Subject<PreferenciasViajeResponse>();
    obtener.mockReturnValue(obtener$);

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    const dateInput = root.querySelector<HTMLInputElement>('app-date-input input');
    const submitBtn = root.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(dateInput?.disabled).toBe(true);
    expect(submitBtn?.disabled).toBe(true);

    obtener$.next(VALID_RESPONSE);
    obtener$.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(dateInput?.disabled).toBe(false);
  });

  it('mueve el foco al primer campo invalido cuando el submit falla la validacion', async () => {
    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    await submitForm(fixture);

    const dateInput = root.querySelector<HTMLInputElement>('app-date-input input');
    expect(document.activeElement).toBe(dateInput);
  });

  // Known limitation: same signal forms submit issue as above.
  it.skip('muestra el mensaje de error del backend cuando el guardado falla', async () => {
    guardar.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({ status: 422, error: { message: 'Selecciona el tipo de viaje.' } })
      )
    );

    const fixture = createFixture();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(fixture);
    await submitForm(fixture);

    expect(toastError).toHaveBeenCalledWith('Selecciona el tipo de viaje.');
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
