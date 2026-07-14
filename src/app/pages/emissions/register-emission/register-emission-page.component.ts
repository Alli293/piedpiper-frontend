import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  form,
  FormField,
  maxDate,
  maxLength,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateInputComponent } from '../../../shared/components/inputs/date-input/date-input.component';
import { NumberInputComponent } from '../../../shared/components/inputs/number-input/number-input.component';
import { RadioComponent } from '../../../shared/components/inputs/radio/radio.component';
import { RadioGroupDirective } from '../../../shared/components/inputs/radio/radio-group.directive';
import {
  SelectInputComponent,
  SelectOption,
} from '../../../shared/components/inputs/select-input/select-input.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import {
  HeaderConfig,
  PageLayoutComponent,
  SidebarConfig,
} from '../../../shared/layouts/page-layout/page-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../core/auth/auth.service';
import { EmisionesService } from '../emisiones.service';
import {
  ApiErrorResponse,
  CabinClass,
  DistanceUnit,
  EmisionResponse,
  RegistrarVueloRequest,
  UnidadElectricidad,
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
  distanceUnit: DistanceUnit;
  fechaActividad: Date | null;
  legs: RegistrarVueloLegFormModel[];
}

type EmissionCategory = 'electricidad' | 'vuelo';
type FlightErrorKey =
  | 'passengers'
  | 'fechaActividad'
  | 'legs'
  | `legs.${number}.departureAirport`
  | `legs.${number}.destinationAirport`
  | `legs.${number}.cabinClass`;

function countDecimals(value: number): number {
  const text = value.toString();
  const dotIndex = text.indexOf('.');
  return dotIndex === -1 ? 0 : text.length - dotIndex - 1;
}

function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

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

const GENERIC_CONNECTION_ERROR =
  'No se pudo conectar con el servicio de cálculo de huella. Intente nuevamente más tarde.';

@Component({
  selector: 'app-register-emission-page',
  imports: [
    FormField,
    ButtonComponent,
    IconComponent,
    DateInputComponent,
    NumberInputComponent,
    RadioComponent,
    RadioGroupDirective,
    SelectInputComponent,
    TextInputComponent,
    TextareaComponent,
    PageLayoutComponent,
  ],
  templateUrl: './register-emission-page.component.html',
  styleUrl: './register-emission-page.component.scss',
})
export class RegisterEmissionPageComponent implements OnInit {
  private readonly location = inject(Location);
  private readonly emisionesService = inject(EmisionesService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  protected readonly today = todayUtcMidnight();
  protected readonly distanceUnitOptions: SelectOption[] = [
    { value: 'km', label: 'km' },
    { value: 'mi', label: 'mi' },
  ];
  protected readonly cabinClassOptions: SelectOption[] = [
    { value: 'economy', label: 'Economy' },
    { value: 'premium', label: 'Premium' },
  ];

  protected readonly activeCategory = signal<EmissionCategory>('electricidad');
  protected readonly model = signal<RegistrarElectricidadFormModel>({ ...INITIAL_MODEL });
  protected readonly flightModel = signal<RegistrarVueloFormModel>(
    cloneFlightModel(INITIAL_FLIGHT_MODEL)
  );
  protected readonly flightTouched = signal<Set<FlightErrorKey>>(new Set());
  protected readonly flightSubmitted = signal(false);
  protected readonly flightSubmitting = signal(false);
  protected readonly emisiones = signal<EmisionResponse[]>([]);
  protected readonly loadingEmisiones = signal(false);
  protected readonly editingFlightId = signal<string | null>(null);
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

  protected readonly lastResult = signal<{ carbonKg: number } | null>(null);

  protected readonly tituloError = computed(() => this.fieldError(this.registerForm.titulo()));
  protected readonly electricityValueError = computed(() =>
    this.fieldError(this.registerForm.electricityValue())
  );
  protected readonly electricityUnitError = computed(() =>
    this.fieldError(this.registerForm.electricityUnit())
  );
  protected readonly fechaActividadError = computed(() =>
    this.fieldError(this.registerForm.fechaActividad())
  );
  protected readonly submitting = computed(() => this.registerForm().submitting());
  protected readonly flightErrors = computed(() =>
    validateFlightModel(this.flightModel(), this.today)
  );
  protected readonly canSubmit = computed(() => {
    if (this.activeCategory() === 'electricidad') {
      return this.registerForm().valid() && !this.submitting();
    }
    return Object.keys(this.flightErrors()).length === 0 && !this.flightSubmitting();
  });

  protected readonly sidebarConfig = signal<SidebarConfig>({
    menuItems: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', active: false },
      { id: 'emissions', label: 'Mis Emisiones', icon: 'emisiones', active: true },
      { id: 'auditors', label: 'Auditores', icon: 'auditores', active: false },
      { id: 'audits', label: 'Auditorías', icon: 'auditorias', active: false },
      { id: 'certifications', label: 'Certificaciones', icon: 'certificaciones', active: false },
      { id: 'benchmark', label: 'Madurez ambiental', icon: 'benchmark', active: false },
      { id: 'badges', label: 'Insignias', icon: 'insignias', active: false },
      { id: 'public-profile', label: 'Perfil Público', icon: 'perfil-publico', active: false },
      { id: 'team-members', label: 'Colaboradores', icon: 'colaboradores', active: false },
    ],
    bottomItems: [
      { id: 'settings', label: 'Configuración', icon: 'config' },
      { id: 'logout', label: 'Cerrar sesión', icon: 'logout' },
    ],
    companyName: 'Café del Valle S.A.',
    companyRole: 'Empresa · Admin',
    companyInitials: 'CV',
  });

  protected readonly headerConfig = signal<HeaderConfig>({
    sectionLabel: 'PANEL EMPRESARIAL',
    pageTitle: 'Registrar emisión',
    showNotificationDot: true,
    userInitials: 'MR',
    showBackButton: true,
  });

  ngOnInit(): void {
    void this.loadEmisiones();
  }

  protected goBack(): void {
    this.location.back();
  }

  protected onCancel(): void {
    if (this.activeCategory() === 'electricidad') {
      this.model.set({ ...INITIAL_MODEL });
      this.registerForm().reset();
    } else {
      this.flightModel.set(cloneFlightModel(INITIAL_FLIGHT_MODEL));
      this.flightTouched.set(new Set());
      this.flightSubmitted.set(false);
      this.editingFlightId.set(null);
    }
    this.lastResult.set(null);
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    if (this.activeCategory() === 'electricidad') {
      void this.onSubmit();
      return;
    }
    void this.onFlightSubmit();
  }

  protected selectCategory(category: EmissionCategory): void {
    this.activeCategory.set(category);
    this.lastResult.set(null);
  }

  protected updateFlightPassengers(passengers: number | null): void {
    this.flightModel.update((model) => ({ ...model, passengers }));
  }

  protected updateFlightDate(fechaActividad: Date | null): void {
    this.flightModel.update((model) => ({ ...model, fechaActividad }));
  }

  protected updateFlightDistanceUnit(distanceUnit: string): void {
    this.flightModel.update((model) => ({ ...model, distanceUnit: distanceUnit as DistanceUnit }));
  }

  protected updateLeg(index: number, field: keyof RegistrarVueloLegFormModel, value: string): void {
    this.flightModel.update((model) => ({
      ...model,
      legs: model.legs.map((leg, currentIndex) =>
        currentIndex === index
          ? {
              ...leg,
              [field]: field === 'cabinClass' ? (value as CabinClass) : value.toUpperCase(),
            }
          : leg
      ),
    }));
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

  protected markFlightTouched(key: string): void {
    this.flightTouched.update((current) => new Set(current).add(key as FlightErrorKey));
  }

  protected flightError(key: string): string {
    const typedKey = key as FlightErrorKey;
    if (!this.flightSubmitted() && !this.flightTouched().has(typedKey)) return '';
    return this.flightErrors()[typedKey] ?? '';
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
            fechaActividad: toIsoDate(value.fechaActividad as Date),
          })
        );
        this.lastResult.set({ carbonKg: response.carbonKg });
        await this.loadEmisiones();
        this.toastService.success(
          'Consumo eléctrico registrado.',
          `Huella calculada: ${response.carbonKg} kg CO₂e.`
        );
        this.model.set({ ...INITIAL_MODEL });
        this.registerForm().reset();
      } catch (error) {
        this.reportSubmissionError(error);
      }
      return undefined;
    });
  }

  private async onFlightSubmit(): Promise<void> {
    if (!this.ensureSession()) return;

    this.flightSubmitted.set(true);
    if (Object.keys(this.flightErrors()).length > 0) {
      return;
    }

    const value = this.flightModel();
    this.flightSubmitting.set(true);
    try {
      const payload = buildFlightPayload(value);
      const editingId = this.editingFlightId();
      const response = await firstValueFrom(
        editingId
          ? this.emisionesService.actualizarVuelo(editingId, payload)
          : this.emisionesService.registrarVuelo(payload)
      );
      this.lastResult.set({ carbonKg: response.carbonKg });
      await this.loadEmisiones();
      this.toastService.success(
        editingId ? 'Viaje aéreo actualizado.' : 'Viaje aéreo registrado.',
        `Huella calculada: ${response.carbonKg} kg CO₂e.`
      );
      this.flightModel.set(cloneFlightModel(INITIAL_FLIGHT_MODEL));
      this.flightTouched.set(new Set());
      this.flightSubmitted.set(false);
      this.editingFlightId.set(null);
    } catch (error) {
      this.reportSubmissionError(error);
    } finally {
      this.flightSubmitting.set(false);
    }
  }

  protected editFlight(emision: EmisionResponse): void {
    if (emision.categoria !== 'VUELO') return;
    this.activeCategory.set('vuelo');
    this.editingFlightId.set(emision.id);
    this.lastResult.set(null);
    this.flightTouched.set(new Set());
    this.flightSubmitted.set(false);
    this.flightModel.set({
      passengers: emision.passengers ?? 1,
      distanceUnit: emision.distanceUnit ?? 'km',
      fechaActividad: new Date(`${emision.fechaActividad}T00:00:00Z`),
      legs: (emision.legs ?? []).map((leg) => ({
        departureAirport: leg.departureAirport,
        destinationAirport: leg.destinationAirport,
        cabinClass: leg.cabinClass,
      })),
    });
  }

  protected async deleteEmission(emision: EmisionResponse): Promise<void> {
    if (!this.ensureSession()) return;

    const confirmed = globalThis.confirm(
      `¿Eliminar el registro "${emision.titulo}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      await firstValueFrom(this.emisionesService.eliminarEmision(emision.id));
      await this.loadEmisiones();
      if (this.editingFlightId() === emision.id) {
        this.onCancel();
      }
      this.toastService.success('Registro eliminado.');
    } catch (error) {
      this.reportSubmissionError(error);
    }
  }

  private async loadEmisiones(): Promise<void> {
    this.hasSession.set(this.hasActiveSession());
    if (!this.hasSession()) {
      this.emisiones.set([]);
      return;
    }

    this.loadingEmisiones.set(true);
    try {
      this.emisiones.set(await firstValueFrom(this.emisionesService.listarEmisiones()));
    } catch {
      this.emisiones.set([]);
    } finally {
      this.loadingEmisiones.set(false);
    }
  }

  private reportSubmissionError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as ApiErrorResponse | null;
      if (apiError?.message) {
        this.toastService.error(apiError.message);
        return;
      }
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

  private fieldError(field: {
    touched(): boolean;
    errors(): readonly { message?: string }[];
  }): string {
    if (!field.touched()) return '';
    return field.errors()[0]?.message ?? '';
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
    fechaActividad: toIsoDate(model.fechaActividad as Date),
    legs: model.legs.map((leg) => ({
      departureAirport: leg.departureAirport.toUpperCase(),
      destinationAirport: leg.destinationAirport.toUpperCase(),
      cabinClass: leg.cabinClass,
    })),
  };
}

function validateFlightModel(
  model: RegistrarVueloFormModel,
  today: Date
): Partial<Record<FlightErrorKey, string>> {
  const errors: Partial<Record<FlightErrorKey, string>> = {};
  if (!Number.isInteger(model.passengers) || (model.passengers ?? 0) < 1) {
    errors.passengers = 'Ingrese al menos 1 pasajero.';
  }
  if (model.legs.length === 0) {
    errors.legs = 'Agregue al menos un trayecto.';
  }
  if (!model.fechaActividad) {
    errors.fechaActividad = 'Ingrese una fecha para este registro.';
  } else if (model.fechaActividad.getTime() > today.getTime()) {
    errors.fechaActividad = 'La fecha no puede ser posterior a hoy.';
  }
  model.legs.forEach((leg, index) => {
    const departureKey = `legs.${index}.departureAirport` as const;
    const destinationKey = `legs.${index}.destinationAirport` as const;
    const cabinKey = `legs.${index}.cabinClass` as const;
    if (!/^[A-Za-z]{3}$/.test(leg.departureAirport)) {
      errors[departureKey] = 'Ingrese un código IATA de 3 letras.';
    }
    if (!/^[A-Za-z]{3}$/.test(leg.destinationAirport)) {
      errors[destinationKey] = 'Ingrese un código IATA de 3 letras.';
    }
    if (
      /^[A-Za-z]{3}$/.test(leg.departureAirport) &&
      leg.departureAirport.toUpperCase() === leg.destinationAirport.toUpperCase()
    ) {
      errors[destinationKey] = 'El origen y el destino no pueden ser iguales.';
    }
    if (!['economy', 'premium'].includes(leg.cabinClass)) {
      errors[cabinKey] = 'Seleccione una clase válida.';
    }
  });
  return errors;
}
