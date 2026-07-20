import { Component, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  applyEach,
  disabled,
  form,
  FormField,
  maxDate,
  maxLength,
  pattern,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateInputComponent } from '../../../shared/components/inputs/date-input/date-input.component';
import { NumberInputComponent } from '../../../shared/components/inputs/number-input/number-input.component';
import { RadioGroupFieldComponent } from '../../../shared/components/inputs/radio-group-field/radio-group-field.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../../shared/components/inputs/select-input/select-input.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { todayUtcMidnight, toIsoDateString } from '../../../shared/utils/date.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage, isAuthError } from '../../../shared/utils/http-error.utils';
import { countDecimals } from '../../../shared/utils/number.utils';
import {
  EmissionCategoryTab,
  EmissionCategoryTabsComponent,
} from '../category-tabs/category-tabs.component';
import { AuthService } from '../../../core/auth/auth.service';
import { EmisionesService } from '../emisiones.service';
import {
  CabinClass,
  MetodoTransporte,
  RegistrarVueloRequest,
  TipoVehiculoOption,
  UnidadDistancia,
  UnidadElectricidad,
  UnidadPeso,
} from '../models/emision.model';

interface RegistrarElectricidadFormModel {
  titulo: string;
  electricityValue: number | null;
  electricityUnit: UnidadElectricidad;
  fechaActividad: Date | null;
}

interface RegistrarVueloLegFormModel {
  departureAirport: string;
  destinationAirport: string;
  cabinClass: CabinClass;
}

interface RegistrarVueloFormModel {
  passengers: number | null;
  distanceUnit: UnidadDistancia;
  fechaActividad: Date | null;
  legs: RegistrarVueloLegFormModel[];
}

interface RegistrarFlotaFormModel {
  titulo: string;
  tipoVehiculo: string;
  combustible: string;
  distanceValue: number | null;
  distanceUnit: UnidadDistancia;
  fechaActividad: Date | null;
}

interface RegistrarEnvioFormModel {
  titulo: string;
  weightValue: number | null;
  weightUnit: UnidadPeso;
  distanceValue: number | null;
  distanceUnit: UnidadDistancia;
  transportMethod: MetodoTransporte;
  fechaActividad: Date | null;
}

type EmissionCategory = 'electricidad' | 'vuelo' | 'flota' | 'envio';

const INITIAL_MODEL: RegistrarElectricidadFormModel = {
  titulo: '',
  electricityValue: null,
  electricityUnit: 'kwh',
  fechaActividad: null,
};

const INITIAL_FLIGHT_MODEL: RegistrarVueloFormModel = {
  passengers: 1,
  distanceUnit: 'km',
  fechaActividad: null,
  legs: [{ departureAirport: '', destinationAirport: '', cabinClass: 'economy' }],
};

const INITIAL_FLOTA_MODEL: RegistrarFlotaFormModel = {
  titulo: '',
  tipoVehiculo: '',
  combustible: '',
  distanceValue: null,
  distanceUnit: 'km',
  fechaActividad: null,
};

const INITIAL_ENVIO_MODEL: RegistrarEnvioFormModel = {
  titulo: '',
  weightValue: null,
  weightUnit: 'KG',
  distanceValue: null,
  distanceUnit: 'km',
  transportMethod: 'TRUCK',
  fechaActividad: null,
};

const GENERIC_CONNECTION_ERROR =
  'No se pudo conectar con el servicio de cálculo de huella. Intente nuevamente más tarde.';

const SESSION_ERROR_MESSAGE = 'Tu sesión no tiene permisos para realizar esta acción.';

const CATALOGO_ERROR_MESSAGE = 'No se pudo cargar el catálogo de vehículos.';

const CATEGORY_TABS: EmissionCategoryTab[] = [
  { id: 'electricidad', label: 'Electricidad', icon: 'electricidad' },
  { id: 'flota', label: 'Flota vehicular', icon: 'flota-vehicular' },
  { id: 'vuelo', label: 'Vuelos', icon: 'vuelos' },
  { id: 'envio', label: 'Envíos de carga', icon: 'envios-carga' },
];

@Component({
  selector: 'app-register-emission-page',
  imports: [
    FormField,
    ButtonComponent,
    HeadingComponent,
    IconComponent,
    DateInputComponent,
    NumberInputComponent,
    RadioGroupFieldComponent,
    SelectInputComponent,
    TextInputComponent,
    TextareaComponent,
    ShellLayoutComponent,
    EmissionCategoryTabsComponent,
  ],
  templateUrl: './register-emission-page.component.html',
  styleUrl: './register-emission-page.component.scss',
})
export class RegisterEmissionPageComponent {
  protected readonly fieldError = fieldError;

  private readonly emisionesService = inject(EmisionesService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  protected readonly today = todayUtcMidnight();
  protected readonly categoryTabs = CATEGORY_TABS;
  protected readonly electricityUnitOptions: SelectOption[] = [
    { value: 'kwh', label: 'kWh' },
    { value: 'mwh', label: 'MWh' },
  ];
  protected readonly distanceUnitOptions: SelectOption[] = [
    { value: 'km', label: 'km' },
    { value: 'mi', label: 'mi' },
  ];
  protected readonly cabinClassOptions: SelectOption[] = [
    { value: 'economy', label: 'Economy' },
    { value: 'premium', label: 'Premium' },
  ];
  protected readonly weightUnitOptions: SelectOption[] = [
    { value: 'G', label: 'g' },
    { value: 'LB', label: 'lb' },
    { value: 'KG', label: 'kg' },
    { value: 'MT', label: 'mt' },
  ];
  protected readonly transportMethodOptions: SelectOption[] = [
    { value: 'SHIP', label: 'Barco' },
    { value: 'TRAIN', label: 'Tren' },
    { value: 'TRUCK', label: 'Camión' },
    { value: 'PLANE', label: 'Avión' },
  ];

  protected readonly activeCategory = signal<EmissionCategory>('electricidad');
  protected readonly model = signal<RegistrarElectricidadFormModel>({ ...INITIAL_MODEL });
  protected readonly flightModel = signal<RegistrarVueloFormModel>(
    cloneFlightModel(INITIAL_FLIGHT_MODEL)
  );
  protected readonly hasSession = signal(this.hasActiveSession());

  protected readonly registerForm = form(
    this.model,
    schema<RegistrarElectricidadFormModel>((path) => {
      required(path.titulo, { message: 'Ingrese un título para este registro.' });
      maxLength(path.titulo, 150, {
        message: 'El título no puede contener más de 150 caracteres.',
      });

      required(path.electricityValue, { message: 'Ingrese una cantidad mayor que 0.' });
      validate(path.electricityValue, ({ value }) => {
        const amount = value();
        if (amount === null) return undefined;
        if (amount <= 0 || countDecimals(amount) > 3) {
          return { kind: 'positiveAmount', message: 'Ingrese una cantidad mayor que 0.' };
        }
        return undefined;
      });

      required(path.electricityUnit, { message: 'Seleccione una unidad válida.' });

      required(path.fechaActividad, { message: 'Ingrese una fecha para este registro.' });
      maxDate(path.fechaActividad, this.today, {
        message: 'La fecha no puede ser posterior a hoy.',
      });
    })
  );

  protected readonly flotaModel = signal<RegistrarFlotaFormModel>({ ...INITIAL_FLOTA_MODEL });

  protected readonly flotaForm = form(
    this.flotaModel,
    schema<RegistrarFlotaFormModel>((path) => {
      required(path.titulo, { message: 'Ingrese un título para este registro.' });
      maxLength(path.titulo, 150, {
        message: 'El título no puede contener más de 150 caracteres.',
      });

      required(path.tipoVehiculo, { message: 'Seleccione un tipo de vehículo.' });
      disabled(path.tipoVehiculo, () => this.catalogoLoading());

      required(path.combustible, {
        message: 'Seleccione un combustible válido para este tipo de vehículo.',
      });
      disabled(path.combustible, (ctx) => !ctx.valueOf(path.tipoVehiculo));

      required(path.distanceValue, { message: 'Ingrese una distancia mayor que 0.' });
      validate(path.distanceValue, ({ value }) => {
        const amount = value();
        if (amount === null) return undefined;
        if (amount <= 0 || countDecimals(amount) > 3) {
          return { kind: 'positiveDistance', message: 'Ingrese una distancia mayor que 0.' };
        }
        return undefined;
      });

      required(path.distanceUnit, { message: 'Seleccione una unidad válida.' });

      required(path.fechaActividad, { message: 'Ingrese una fecha para este registro.' });
      maxDate(path.fechaActividad, this.today, {
        message: 'La fecha no puede ser posterior a hoy.',
      });
    })
  );

  protected readonly flightForm = form(
    this.flightModel,
    schema<RegistrarVueloFormModel>((path) => {
      required(path.passengers, { message: 'Ingrese al menos 1 pasajero.' });
      validate(path.passengers, ({ value }) => {
        const passengers = value();
        if (passengers === null) return undefined;
        if (!Number.isInteger(passengers) || passengers < 1) {
          return { kind: 'minPassengers', message: 'Ingrese al menos 1 pasajero.' };
        }
        return undefined;
      });

      required(path.fechaActividad, { message: 'Ingrese una fecha para este registro.' });
      maxDate(path.fechaActividad, this.today, {
        message: 'La fecha no puede ser posterior a hoy.',
      });

      validate(path.legs, ({ value }) => {
        if (value().length === 0) {
          return { kind: 'minLegs', message: 'Agregue al menos un trayecto.' };
        }
        return undefined;
      });

      applyEach(path.legs, (leg) => {
        required(leg.departureAirport, { message: 'Ingrese un código IATA de 3 letras.' });
        pattern(leg.departureAirport, /^[A-Za-z]{3}$/, {
          message: 'Ingrese un código IATA de 3 letras.',
        });

        required(leg.destinationAirport, { message: 'Ingrese un código IATA de 3 letras.' });
        pattern(leg.destinationAirport, /^[A-Za-z]{3}$/, {
          message: 'Ingrese un código IATA de 3 letras.',
        });
        validate(leg.destinationAirport, (ctx) => {
          const destination = ctx.value();
          const departure = ctx.valueOf(leg.departureAirport);
          if (
            /^[A-Za-z]{3}$/.test(departure) &&
            /^[A-Za-z]{3}$/.test(destination) &&
            departure.toUpperCase() === destination.toUpperCase()
          ) {
            return {
              kind: 'sameAirport',
              message: 'El origen y el destino no pueden ser iguales.',
            };
          }
          return undefined;
        });

        required(leg.cabinClass, { message: 'Seleccione una clase válida.' });
      });
    })
  );

  protected readonly envioModel = signal<RegistrarEnvioFormModel>({ ...INITIAL_ENVIO_MODEL });

  protected readonly envioForm = form(
    this.envioModel,
    schema<RegistrarEnvioFormModel>((path) => {
      required(path.titulo, { message: 'Ingrese un título para este registro.' });
      maxLength(path.titulo, 150, {
        message: 'El título no puede contener más de 150 caracteres.',
      });

      required(path.weightValue, { message: 'Ingrese una cantidad mayor que 0.' });
      validate(path.weightValue, ({ value }) => {
        const amount = value();
        if (amount === null) return undefined;
        if (amount <= 0 || countDecimals(amount) > 3) {
          return { kind: 'positiveAmount', message: 'Ingrese una cantidad mayor que 0.' };
        }
        return undefined;
      });

      required(path.weightUnit, { message: 'Seleccione una unidad válida.' });

      required(path.distanceValue, { message: 'Ingrese una cantidad mayor que 0.' });
      validate(path.distanceValue, ({ value }) => {
        const amount = value();
        if (amount === null) return undefined;
        if (amount <= 0 || countDecimals(amount) > 3) {
          return { kind: 'positiveAmount', message: 'Ingrese una cantidad mayor que 0.' };
        }
        return undefined;
      });

      required(path.distanceUnit, { message: 'Seleccione una unidad válida.' });

      required(path.transportMethod, { message: 'Seleccione un método de transporte.' });

      required(path.fechaActividad, { message: 'Ingrese una fecha para este registro.' });
      maxDate(path.fechaActividad, this.today, {
        message: 'La fecha no puede ser posterior a hoy.',
      });
    })
  );

  protected readonly tiposVehiculo = signal<TipoVehiculoOption[]>([]);
  protected readonly catalogoLoading = signal(false);
  protected readonly catalogoError = signal('');
  protected readonly catalogoLoaded = signal(false);

  private readonly flotaCombustible = computed(() => this.flotaModel().combustible);

  protected readonly tipoVehiculoOptions = computed<SelectOption[]>(() =>
    this.tiposVehiculo().map((tipo) => ({ value: tipo.id, label: tipo.nombre }))
  );

  protected readonly combustibleOptions = computed<SelectOption[]>(() => {
    const tipoVehiculoId = this.flotaForm.tipoVehiculo().value();
    if (!tipoVehiculoId) return [];
    const tipo = this.tiposVehiculo().find((candidate) => candidate.id === tipoVehiculoId);
    return tipo ? tipo.combustibles.map((c) => ({ value: c.id, label: c.nombre })) : [];
  });

  protected readonly tituloError = computed(() => fieldError(this.registerForm.titulo()));
  protected readonly electricityValueError = computed(() =>
    fieldError(this.registerForm.electricityValue())
  );
  protected readonly electricityUnitError = computed(() =>
    fieldError(this.registerForm.electricityUnit())
  );
  protected readonly fechaActividadError = computed(() =>
    fieldError(this.registerForm.fechaActividad())
  );
  protected readonly flightPassengersError = computed(() =>
    fieldError(this.flightForm.passengers())
  );
  protected readonly flightFechaActividadError = computed(() =>
    fieldError(this.flightForm.fechaActividad())
  );
  protected readonly flightLegsError = computed(() => fieldError(this.flightForm.legs()));

  protected readonly flotaTituloError = computed(() => fieldError(this.flotaForm.titulo()));
  protected readonly tipoVehiculoError = computed(() => fieldError(this.flotaForm.tipoVehiculo()));
  protected readonly combustibleError = computed(() => fieldError(this.flotaForm.combustible()));
  protected readonly distanceValueError = computed(() =>
    fieldError(this.flotaForm.distanceValue())
  );
  protected readonly distanceUnitError = computed(() => fieldError(this.flotaForm.distanceUnit()));
  protected readonly flotaFechaActividadError = computed(() =>
    fieldError(this.flotaForm.fechaActividad())
  );

  protected readonly envioTituloError = computed(() => fieldError(this.envioForm.titulo()));
  protected readonly envioWeightValueError = computed(() =>
    fieldError(this.envioForm.weightValue())
  );
  protected readonly envioWeightUnitError = computed(() => fieldError(this.envioForm.weightUnit()));
  protected readonly envioDistanceValueError = computed(() =>
    fieldError(this.envioForm.distanceValue())
  );
  protected readonly envioDistanceUnitError = computed(() =>
    fieldError(this.envioForm.distanceUnit())
  );
  protected readonly envioTransportMethodError = computed(() =>
    fieldError(this.envioForm.transportMethod())
  );
  protected readonly envioFechaActividadError = computed(() =>
    fieldError(this.envioForm.fechaActividad())
  );

  protected readonly submitting = computed(() => {
    if (this.activeCategory() === 'flota') return this.flotaForm().submitting();
    if (this.activeCategory() === 'envio') return this.envioForm().submitting();
    if (this.activeCategory() === 'vuelo') return this.flightForm().submitting();
    return this.registerForm().submitting();
  });
  protected readonly canSubmit = computed(() => {
    if (this.activeCategory() === 'flota') {
      return this.flotaForm().valid() && !this.submitting();
    }
    if (this.activeCategory() === 'envio') {
      return this.envioForm().valid() && !this.submitting();
    }
    if (this.activeCategory() === 'vuelo') {
      return this.flightForm().valid() && !this.submitting();
    }
    return this.registerForm().valid() && !this.submitting();
  });

  protected readonly headerConfig = signal<HeaderConfig>({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Registrar emisión',
    showNotificationDot: true,
    userInitials: 'MR',
    showBackButton: true,
  });

  constructor() {
    effect(() => {
      const validCombustibles = this.combustibleOptions();
      const current = this.flotaCombustible();
      if (current && !validCombustibles.some((option) => option.value === current)) {
        this.flotaModel.update((model) => ({ ...model, combustible: '' }));
      }
    });
  }

  protected onCategorySelected(category: string): void {
    this.selectCategory(category as EmissionCategory);
  }

  protected retryLoadTiposVehiculo(): void {
    this.loadTiposVehiculo();
  }

  protected onCancel(): void {
    switch (this.activeCategory()) {
      case 'electricidad':
        this.model.set({ ...INITIAL_MODEL });
        this.registerForm().reset();
        break;
      case 'flota':
        this.flotaModel.set({ ...INITIAL_FLOTA_MODEL });
        this.flotaForm().reset();
        break;
      case 'envio':
        this.envioModel.set({ ...INITIAL_ENVIO_MODEL });
        this.envioForm().reset();
        break;
      case 'vuelo':
        this.flightModel.set(cloneFlightModel(INITIAL_FLIGHT_MODEL));
        this.flightForm().reset();
        break;
    }
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    switch (this.activeCategory()) {
      case 'electricidad':
        void this.onSubmit();
        break;
      case 'flota':
        void this.onSubmitFlota();
        break;
      case 'envio':
        void this.onSubmitEnvio();
        break;
      case 'vuelo':
        void this.onFlightSubmit();
        break;
    }
  }

  protected selectCategory(category: EmissionCategory): void {
    this.activeCategory.set(category);
    if (category === 'flota' && !this.catalogoLoaded() && !this.catalogoLoading()) {
      this.loadTiposVehiculo();
    }
  }

  protected addLeg(): void {
    this.flightModel.update((model) => ({
      ...model,
      legs: [
        ...model.legs,
        { departureAirport: '', destinationAirport: '', cabinClass: 'economy' },
      ],
    }));
  }

  protected removeLeg(index: number): void {
    this.flightModel.update((model) => ({
      ...model,
      legs: model.legs.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  private loadTiposVehiculo(): void {
    this.catalogoLoading.set(true);
    this.catalogoError.set('');
    this.emisionesService.obtenerTiposVehiculo().subscribe({
      next: (tipos) => {
        this.tiposVehiculo.set(tipos);
        this.catalogoLoaded.set(true);
        this.catalogoLoading.set(false);
      },
      error: (error: unknown) => {
        this.tiposVehiculo.set([]);
        this.catalogoError.set(isAuthError(error) ? SESSION_ERROR_MESSAGE : CATALOGO_ERROR_MESSAGE);
        this.catalogoLoading.set(false);
      },
    });
  }

  private async onSubmit(): Promise<void> {
    if (!this.ensureSession()) return;

    await submit(this.registerForm, async (field) => {
      const value = field().value();
      try {
        const response = await firstValueFrom(
          this.emisionesService.registrarElectricidad({
            titulo: value.titulo,
            electricityValue: value.electricityValue as number,
            electricityUnit: value.electricityUnit,
            fechaActividad: toIsoDateString(value.fechaActividad as Date),
          })
        );
        this.toastService.success(
          'Consumo eléctrico registrado.',
          `Huella calculada: ${response.carbonKg} kg CO₂e.`
        );
        this.model.set({ ...INITIAL_MODEL });
        this.registerForm().reset();
      } catch (error: unknown) {
        this.reportSubmissionError(error);
      }
      return undefined;
    });
  }

  private async onFlightSubmit(): Promise<void> {
    if (!this.ensureSession()) return;

    await submit(this.flightForm, async (field) => {
      const value = field().value();
      try {
        const payload = buildFlightPayload(value);
        const response = await firstValueFrom(this.emisionesService.registrarVuelo(payload));
        this.toastService.success(
          'Viaje aéreo registrado.',
          `Huella calculada: ${response.carbonKg} kg CO₂e.`
        );
        this.flightModel.set(cloneFlightModel(INITIAL_FLIGHT_MODEL));
        this.flightForm().reset();
      } catch (error: unknown) {
        this.reportSubmissionError(error);
      }
      return undefined;
    });
  }

  private async onSubmitFlota(): Promise<void> {
    if (!this.ensureSession()) return;

    await submit(this.flotaForm, async (field) => {
      const value = field().value();
      try {
        const fechaActividad = value.fechaActividad as Date;
        const response = await firstValueFrom(
          this.emisionesService.registrarFlota({
            titulo: value.titulo,
            tipoVehiculo: value.tipoVehiculo,
            combustible: value.combustible,
            distanceValue: value.distanceValue as number,
            distanceUnit: value.distanceUnit,
            fechaActividad: toIsoDateString(fechaActividad),
          })
        );
        this.toastService.success(
          'Emisión de flota registrada.',
          `Huella calculada: ${response.carbonKg} kg CO₂e.`
        );
        this.flotaModel.set({ ...INITIAL_FLOTA_MODEL });
        this.flotaForm().reset();
      } catch (error: unknown) {
        this.reportSubmissionError(error);
      }
      return undefined;
    });
  }

  private async onSubmitEnvio(): Promise<void> {
    if (!this.ensureSession()) return;

    await submit(this.envioForm, async (field) => {
      const value = field().value();
      try {
        const fechaActividad = value.fechaActividad as Date;
        const response = await firstValueFrom(
          this.emisionesService.registrarEnvio({
            titulo: value.titulo,
            weightValue: value.weightValue as number,
            weightUnit: value.weightUnit,
            distanceValue: value.distanceValue as number,
            distanceUnit: value.distanceUnit,
            transportMethod: value.transportMethod,
            fechaActividad: toIsoDateString(fechaActividad),
          })
        );
        this.toastService.success(
          'Envío registrado.',
          `Huella calculada: ${response.carbonKg} kg CO₂e.`
        );
        this.envioModel.set({ ...INITIAL_ENVIO_MODEL });
        this.envioForm().reset();
      } catch (error: unknown) {
        this.reportSubmissionError(error);
      }
      return undefined;
    });
  }

  private reportSubmissionError(error: unknown): void {
    const apiMessage = apiErrorMessage(error);
    if (apiMessage) {
      this.toastService.error(apiMessage);
      return;
    }
    if (isAuthError(error)) {
      this.toastService.error(SESSION_ERROR_MESSAGE);
      return;
    }
    this.toastService.error(GENERIC_CONNECTION_ERROR);
  }

  private ensureSession(): boolean {
    this.hasSession.set(this.hasActiveSession());
    if (this.hasSession()) return true;
    this.toastService.error('Debe iniciar sesión para registrar emisiones.');
    return false;
  }

  private hasActiveSession(): boolean {
    return Boolean(this.authService.token());
  }
}

function cloneFlightModel(model: RegistrarVueloFormModel): RegistrarVueloFormModel {
  return {
    ...model,
    legs: model.legs.map((leg) => ({ ...leg })),
  };
}

function buildFlightPayload(model: RegistrarVueloFormModel): RegistrarVueloRequest {
  return {
    passengers: model.passengers as number,
    distanceUnit: model.distanceUnit,
    fechaActividad: toIsoDateString(model.fechaActividad as Date),
    legs: model.legs.map((leg) => ({
      departureAirport: leg.departureAirport.toUpperCase(),
      destinationAirport: leg.destinationAirport.toUpperCase(),
      cabinClass: leg.cabinClass,
    })),
  };
}
