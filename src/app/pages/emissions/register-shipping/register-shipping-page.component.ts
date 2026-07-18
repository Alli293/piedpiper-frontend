import { Component, computed, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
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
import { TextareaComponent } from '../../../shared/components/inputs/textarea/textarea.component';
import {
  HeaderConfig,
  PageLayoutComponent,
  SidebarConfig,
} from '../../../shared/layouts/page-layout/page-layout.component';
import { ToastService } from '../../../shared/services/toast.service';
import { toIsoDateString, toSpanishMonthName } from '../../../shared/utils/date.utils';
import { EmisionesService } from '../emisiones.service';
import {
  ApiErrorResponse,
  MetodoTransporte,
  UnidadDistancia,
  UnidadPeso,
} from '../models/emision.model';

interface RegistrarEnvioFormModel {
  titulo: string;
  weightValue: number | null;
  weightUnit: UnidadPeso;
  distanceValue: number | null;
  distanceUnit: UnidadDistancia;
  transportMethod: MetodoTransporte;
  fechaActividad: Date | null;
}

function countDecimals(value: number): number {
  const text = value.toString();
  const dotIndex = text.indexOf('.');
  return dotIndex === -1 ? 0 : text.length - dotIndex - 1;
}

function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

const INITIAL_MODEL: RegistrarEnvioFormModel = {
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

const SESSION_ERROR_MESSAGE =
  'Tu sesión no es válida o expiró. Inicia sesión nuevamente para registrar esta emisión.';

@Component({
  selector: 'app-register-shipping-page',
  imports: [
    FormField,
    ButtonComponent,
    IconComponent,
    DateInputComponent,
    NumberInputComponent,
    RadioComponent,
    RadioGroupDirective,
    TextareaComponent,
    PageLayoutComponent,
  ],
  templateUrl: './register-shipping-page.component.html',
  styleUrl: './register-shipping-page.component.scss',
})
export class RegisterShippingPageComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly emisionesService = inject(EmisionesService);
  private readonly toastService = inject(ToastService);

  private readonly today = todayUtcMidnight();

  protected readonly model = signal<RegistrarEnvioFormModel>({ ...INITIAL_MODEL });

  protected readonly registerForm = form(
    this.model,
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

  protected readonly tituloError = computed(() => this.fieldError(this.registerForm.titulo()));
  protected readonly weightValueError = computed(() =>
    this.fieldError(this.registerForm.weightValue())
  );
  protected readonly weightUnitError = computed(() =>
    this.fieldError(this.registerForm.weightUnit())
  );
  protected readonly distanceValueError = computed(() =>
    this.fieldError(this.registerForm.distanceValue())
  );
  protected readonly distanceUnitError = computed(() =>
    this.fieldError(this.registerForm.distanceUnit())
  );
  protected readonly transportMethodError = computed(() =>
    this.fieldError(this.registerForm.transportMethod())
  );
  protected readonly fechaActividadError = computed(() =>
    this.fieldError(this.registerForm.fechaActividad())
  );

  protected readonly submitting = computed(() => this.registerForm().submitting());
  protected readonly canSubmit = computed(() => this.registerForm().valid() && !this.submitting());

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

  protected navigateToElectricidad(): void {
    void this.router.navigateByUrl('/emisiones/registrar');
  }

  protected goBack(): void {
    this.location.back();
  }

  protected onCancel(): void {
    this.model.set({ ...INITIAL_MODEL });
    this.registerForm().reset();
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async onSubmit(): Promise<void> {
    await submit(this.registerForm, async (field) => {
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
          'Registro guardado correctamente',
          `+${response.carbonKg} kg CO₂e añadidos a tu huella de ${toSpanishMonthName(fechaActividad)}.`
        );
        void this.router.navigateByUrl('/emisiones');
      } catch (error) {
        this.reportSubmissionError(error);
      }
      return undefined;
    });
  }

  private reportSubmissionError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as ApiErrorResponse | null;
      if (apiError?.message) {
        this.toastService.error(apiError.message);
        return;
      }
      if (error.status === 401 || error.status === 403) {
        this.toastService.error(SESSION_ERROR_MESSAGE);
        return;
      }
    }
    this.toastService.error(GENERIC_CONNECTION_ERROR);
  }

  private fieldError(field: {
    touched(): boolean;
    errors(): readonly { message?: string }[];
  }): string {
    if (!field.touched()) return '';
    return field.errors()[0]?.message ?? '';
  }
}
