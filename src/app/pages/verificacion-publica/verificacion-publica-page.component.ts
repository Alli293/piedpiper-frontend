import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  disabled,
  form,
  FormField,
  pattern,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { StateLayoutComponent } from '../../shared/layouts/state-layout/state-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { fieldError } from '../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { rutaBadge } from './badge-artwork.utils';
import { EstadoVerificacion, VerificacionCredencial } from './verificacion-publica.models';
import { VerificacionPublicaService } from './verificacion-publica.service';

interface VerificarFormModel {
  codigo: string;
}

// Misma forma que GeneradorCodigoVerificacionService.FORMATO en el backend.
const CODIGO_PATTERN = /^CH-\d{4}-[0-9A-HJKMNP-TV-Z]{8}$/i;
const CODIGO_MENSAJE = 'El código no tiene un formato válido.';
const MENSAJE_SERVICIO_NO_DISPONIBLE =
  'El servicio de verificación no está disponible en este momento. Intenta más tarde.';

const ESTADOS: Record<
  EstadoVerificacion,
  { etiqueta: string; variante: BadgeVariant; icon: IconName }
> = {
  valida_vigente: { etiqueta: 'Credencial válida y vigente', variante: 'success', icon: 'success' },
  valida_vencida: {
    etiqueta: 'Credencial válida pero vencida',
    variante: 'warning',
    icon: 'warning',
  },
  revocada: { etiqueta: 'Credencial revocada', variante: 'danger', icon: 'danger' },
};

@Component({
  selector: 'app-verificacion-publica-page',
  imports: [
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    DatePipe,
    FormField,
    HeadingComponent,
    IconComponent,
    StateLayoutComponent,
    TextInputComponent,
  ],
  templateUrl: './verificacion-publica-page.component.html',
  styleUrl: './verificacion-publica-page.component.scss',
})
export class VerificacionPublicaPageComponent implements OnInit {
  private readonly verificacionPublicaService = inject(VerificacionPublicaService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly codigo = input<string>();

  protected readonly cargando = signal(false);
  protected readonly resultado = signal<VerificacionCredencial | null>(null);
  protected readonly noEncontrado = signal(false);
  protected readonly error = signal(false);
  protected readonly badgeCaido = signal(false);

  protected readonly obtenerRutaBadge = rutaBadge;

  protected readonly formModel = signal<VerificarFormModel>({ codigo: '' });
  protected readonly verificarForm = form(
    this.formModel,
    schema<VerificarFormModel>((path) => {
      required(path.codigo, { message: 'Ingresa el código de verificación.' });
      pattern(path.codigo, CODIGO_PATTERN, { message: CODIGO_MENSAJE });
      disabled(path.codigo, { when: () => this.cargando() });
    })
  );

  protected readonly errorCodigo = computed(() => fieldError(this.verificarForm.codigo()));
  protected readonly enviando = computed(() => this.verificarForm().submitting());

  ngOnInit(): void {
    const codigo = this.codigo();
    if (codigo) {
      void this.verificar(codigo);
    }
  }

  protected etiquetaEstado(estado: EstadoVerificacion): string {
    return ESTADOS[estado].etiqueta;
  }

  protected varianteEstado(estado: EstadoVerificacion): BadgeVariant {
    return ESTADOS[estado].variante;
  }

  protected iconoEstado(estado: EstadoVerificacion): IconName {
    return ESTADOS[estado].icon;
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  protected reintentar(): void {
    const codigo = this.codigo();
    if (codigo) void this.verificar(codigo);
  }

  protected verificarOtra(): void {
    void this.router.navigateByUrl('/verificar');
  }

  protected onBadgeError(): void {
    this.badgeCaido.set(true);
  }

  private async onSubmit(): Promise<void> {
    await submit(this.verificarForm, {
      action: async (field) => {
        const codigo = field().value().codigo.trim().toUpperCase();
        await this.router.navigate(['/verificar', codigo]);
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private async verificar(codigo: string): Promise<void> {
    this.cargando.set(true);
    this.noEncontrado.set(false);
    this.error.set(false);
    this.badgeCaido.set(false);
    this.resultado.set(null);
    try {
      const resultado = await firstValueFrom(this.verificacionPublicaService.verificar(codigo));
      this.resultado.set(resultado);
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.noEncontrado.set(true);
      } else {
        this.error.set(true);
        this.toastService.error(apiErrorMessage(err) ?? MENSAJE_SERVICIO_NO_DISPONIBLE);
      }
    } finally {
      this.cargando.set(false);
    }
  }
}
