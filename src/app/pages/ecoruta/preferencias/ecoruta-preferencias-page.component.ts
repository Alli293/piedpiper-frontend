import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  disabled,
  FormField,
  form,
  maxLength,
  minDate,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from '../../../core/auth-session.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { ChipSelectComponent } from '../../../shared/components/inputs/chip-select/chip-select.component';
import { DateInputComponent } from '../../../shared/components/inputs/date-input/date-input.component';
import { NumberInputComponent } from '../../../shared/components/inputs/number-input/number-input.component';
import { SelectInputComponent } from '../../../shared/components/inputs/select-input/select-input.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import { ToggleSwitchComponent } from '../../../shared/components/inputs/toggle-switch/toggle-switch.component';
import { HeaderConfig } from '../../../shared/layouts/page-layout/page-layout.component';
import { ShellLayoutComponent } from '../../../shared/layouts/shell-layout/shell-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { todayUtcMidnight, toIsoDateString } from '../../../shared/utils/date.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { EcoRutaItinerariosService } from '../itinerarios/ecoruta-itinerarios.service';
import { EcoRutaPreferenciasService } from '../ecoruta-preferencias.service';
import {
  INTERES_OPTIONS,
  PRESUPUESTO_OPTIONS,
  PROVINCIA_OPTIONS,
  PreferenciasViajeRequest,
  PreferenciasViajeResponse,
  TIPO_VIAJE_OPTIONS,
} from '../models/preferencias-viaje.model';

interface PreferenciasViajeFormModel {
  cantidadDias: number | null;
  fechaInicio: Date | null;
  tipoViaje: string;
  presupuesto: string;
  intereses: string[];
  provinciaPreferida: string;
  ubicacionActual: string;
  buscarCercaDeMi: boolean;
  limitacionesMovilidad: string;
  requiereHospedaje: boolean;
}

const INITIAL_MODEL: PreferenciasViajeFormModel = {
  cantidadDias: null,
  fechaInicio: null,
  tipoViaje: '',
  presupuesto: '',
  intereses: [],
  provinciaPreferida: '',
  ubicacionActual: '',
  buscarCercaDeMi: false,
  limitacionesMovilidad: '',
  requiereHospedaje: false,
};

@Component({
  selector: 'app-ecoruta-preferencias-page',
  imports: [
    ButtonComponent,
    ChipSelectComponent,
    DateInputComponent,
    FormField,
    HeadingComponent,
    NumberInputComponent,
    SelectInputComponent,
    ShellLayoutComponent,
    TextInputComponent,
    TextareaComponent,
    ToggleSwitchComponent,
  ],
  templateUrl: './ecoruta-preferencias-page.component.html',
  styleUrl: './ecoruta-preferencias-page.component.scss',
})
export class EcoRutaPreferenciasPageComponent implements OnInit {
  private readonly ecoRutaPreferenciasService = inject(EcoRutaPreferenciasService);
  private readonly itinerariosService = inject(EcoRutaItinerariosService);
  private readonly authSession = inject(AuthSessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Distingue el label del botón entre el paso de guardado y el de generación con IA. */
  protected readonly generandoItinerario = signal(false);

  protected readonly tipoViajeOptions = TIPO_VIAJE_OPTIONS;
  protected readonly interesOptions = INTERES_OPTIONS;
  protected readonly provinciaOptions = PROVINCIA_OPTIONS;
  protected readonly presupuestoOptions = PRESUPUESTO_OPTIONS;

  protected readonly cargando = signal(false);
  protected readonly minFecha = todayUtcMidnight();

  protected readonly model = signal<PreferenciasViajeFormModel>({ ...INITIAL_MODEL });

  protected readonly preferenciasForm = form(
    this.model,
    schema<PreferenciasViajeFormModel>((path) => {
      validate(path.cantidadDias, ({ value }) => {
        const dias = value();
        if (dias === null || dias < 1 || dias > 30) {
          return {
            kind: 'cantidadDias',
            message: 'La duración del viaje debe estar entre 1 y 30 días.',
          };
        }
        return undefined;
      });
      disabled(path.cantidadDias, { when: () => this.cargando() });

      required(path.fechaInicio, { message: 'Selecciona una fecha válida.' });
      minDate(path.fechaInicio, this.minFecha, { message: 'Selecciona una fecha válida.' });
      disabled(path.fechaInicio, { when: () => this.cargando() });

      required(path.tipoViaje, { message: 'Selecciona el tipo de viaje.' });
      disabled(path.tipoViaje, { when: () => this.cargando() });

      validate(path.intereses, ({ value }) => {
        if (value().length === 0) {
          return { kind: 'sinIntereses', message: 'Selecciona al menos una actividad de interés.' };
        }
        return undefined;
      });
      disabled(path.intereses, { when: () => this.cargando() });

      disabled(path.presupuesto, { when: () => this.cargando() });
      disabled(path.provinciaPreferida, { when: () => this.cargando() });
      disabled(path.buscarCercaDeMi, { when: () => this.cargando() });
      disabled(path.requiereHospedaje, { when: () => this.cargando() });

      validate(path.ubicacionActual, ({ value, valueOf }) => {
        if (valueOf(path.buscarCercaDeMi) && !value().trim()) {
          return {
            kind: 'ubicacionRequerida',
            message: 'Ingresa tu ubicación actual para buscar actividades cercanas.',
          };
        }
        return undefined;
      });
      disabled(path.ubicacionActual, { when: () => this.cargando() });

      maxLength(path.limitacionesMovilidad, 500, {
        message: 'El campo no puede superar 500 caracteres.',
      });
      disabled(path.limitacionesMovilidad, { when: () => this.cargando() });
    })
  );

  protected readonly cantidadDiasError = computed(() =>
    fieldError(this.preferenciasForm.cantidadDias())
  );
  protected readonly fechaInicioError = computed(() =>
    fieldError(this.preferenciasForm.fechaInicio())
  );
  protected readonly tipoViajeError = computed(() => fieldError(this.preferenciasForm.tipoViaje()));
  protected readonly interesesError = computed(() => fieldError(this.preferenciasForm.intereses()));
  protected readonly ubicacionActualError = computed(() =>
    fieldError(this.preferenciasForm.ubicacionActual())
  );
  protected readonly limitacionesMovilidadError = computed(() =>
    fieldError(this.preferenciasForm.limitacionesMovilidad())
  );

  protected readonly submitting = computed(() => this.preferenciasForm().submitting());
  protected readonly canSubmit = computed(
    () => this.preferenciasForm().valid() && !this.submitting() && !this.cargando()
  );
  protected readonly submitLabel = computed(() =>
    this.generandoItinerario() ? 'Generando itinerario...' : 'Generar itinerario'
  );

  protected readonly mostrarUbicacion = computed(() => this.model().buscarCercaDeMi);

  protected readonly displayName = computed(
    () => this.authSession.getUserDisplayName() || undefined
  );

  protected readonly headerConfig = computed<HeaderConfig>(() => ({
    sectionLabel: 'ECORUTA',
    pageTitle: 'Planificar viaje',
    showNotificationDot: false,
    userInitials: this.authSession.getUserInitials(),
  }));

  ngOnInit(): void {
    this.cargarPreferencias();
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private cargarPreferencias(): void {
    this.cargando.set(true);
    this.ecoRutaPreferenciasService
      .obtener()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.aplicarRespuesta(response);
          this.cargando.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.cargando.set(false);
          if (error.status === 404) return;
          this.toastService.error('No se pudo cargar tu información previa. Intenta nuevamente.');
        },
      });
  }

  private async onSubmit(): Promise<void> {
    await submit(this.preferenciasForm, {
      action: async (field) => {
        const value = field().value();
        const request: PreferenciasViajeRequest = {
          cantidadDias: value.cantidadDias as number,
          fechaInicio: toIsoDateString(value.fechaInicio as Date),
          tipoViaje: value.tipoViaje,
          presupuesto: value.presupuesto || null,
          intereses: value.intereses,
          provinciaPreferida: value.provinciaPreferida || null,
          ubicacionActual: value.ubicacionActual.trim() || null,
          buscarCercaDeMi: value.buscarCercaDeMi,
          limitacionesMovilidad: value.limitacionesMovilidad.trim() || null,
          requiereHospedaje: value.requiereHospedaje,
        };

        try {
          const response = await firstValueFrom(this.ecoRutaPreferenciasService.guardar(request));
          this.aplicarRespuesta(response);
        } catch (error: unknown) {
          this.manejarErrorGuardado(error);
          return undefined;
        }

        this.generandoItinerario.set(true);
        try {
          const itinerario = await firstValueFrom(this.itinerariosService.generar());
          await this.router.navigateByUrl(`/ecoruta/itinerarios/${itinerario.id}`);
        } catch (error: unknown) {
          this.manejarErrorGeneracion(error);
        } finally {
          this.generandoItinerario.set(false);
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });

    if (!this.preferenciasForm().valid()) {
      this.enfocarPrimerCampoInvalido();
    }
  }

  /**
   * Recorre los campos en el mismo orden en que aparecen en el formulario y enfoca el
   * primer control invalido. Usa el estado del field tree (no el DOM) para decidir cual
   * es el primero invalido, ya que aria-invalid tarda un ciclo de render en reflejarse.
   */
  private enfocarPrimerCampoInvalido(): void {
    const root = this.elementRef.nativeElement;
    const gruposDeChips = root.querySelectorAll<HTMLElement>('app-chip-select');

    const candidatos: { invalido: boolean; elemento: HTMLElement | null }[] = [
      {
        invalido: this.preferenciasForm.fechaInicio().invalid(),
        elemento: root.querySelector('app-date-input input'),
      },
      {
        invalido: this.preferenciasForm.cantidadDias().invalid(),
        elemento: root.querySelector('app-number-input input'),
      },
      {
        invalido: this.preferenciasForm.tipoViaje().invalid(),
        elemento: gruposDeChips[0]?.querySelector('button') ?? null,
      },
      {
        invalido: this.preferenciasForm.intereses().invalid(),
        elemento: gruposDeChips[1]?.querySelector('button') ?? null,
      },
      {
        invalido: this.preferenciasForm.ubicacionActual().invalid(),
        elemento: root.querySelector('app-text-input input'),
      },
      {
        invalido: this.preferenciasForm.limitacionesMovilidad().invalid(),
        elemento: root.querySelector('app-textarea textarea'),
      },
    ];

    candidatos.find((candidato) => candidato.invalido)?.elemento?.focus();
  }

  private aplicarRespuesta(response: PreferenciasViajeResponse): void {
    this.model.set({
      cantidadDias: response.cantidadDias,
      fechaInicio: new Date(response.fechaInicio),
      tipoViaje: response.tipoViaje,
      presupuesto: response.presupuesto ?? '',
      intereses: response.intereses,
      provinciaPreferida: response.provinciaPreferida ?? '',
      ubicacionActual: response.ubicacionActual ?? '',
      buscarCercaDeMi: response.buscarCercaDeMi,
      limitacionesMovilidad: response.limitacionesMovilidad ?? '',
      requiereHospedaje: response.requiereHospedaje,
    });
  }

  private manejarErrorGuardado(error: unknown): void {
    const fallback = 'No se pudieron guardar tus preferencias. Intenta nuevamente.';
    if (error instanceof HttpErrorResponse) {
      this.toastService.error(apiErrorMessage(error) ?? fallback);
      return;
    }
    this.toastService.error(fallback);
  }

  private manejarErrorGeneracion(error: unknown): void {
    const fallback = 'Ocurrió un error al generar el itinerario. Intenta nuevamente más tarde.';
    if (error instanceof HttpErrorResponse) {
      this.toastService.error(apiErrorMessage(error) ?? fallback);
      return;
    }
    this.toastService.error(fallback);
  }
}
