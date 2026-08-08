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
import { SemanticCardComponent } from '../../shared/components/semantic-card/semantic-card.component';
import { StateLayoutComponent } from '../../shared/layouts/state-layout/state-layout.component';
import { ToastService } from '../../shared/services/toast.service';
import { fieldError } from '../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../shared/utils/http-error.utils';
import { EstadoVerificacion, VerificacionCredencial } from './verificacion-publica.models';
import { VerificacionPublicaService } from './verificacion-publica.service';

interface VerificarFormModel {
  codigo: string;
}

interface EstadoInfo {
  titulo: string;
  etiquetaCorta: string;
  variante: BadgeVariant;
  icon: IconName;
}

// Misma forma que GeneradorCodigoVerificacionService.FORMATO en el backend.
const CODIGO_PATTERN = /^CH-\d{4}-[0-9A-HJKMNP-TV-Z]{8}$/i;
const CODIGO_MENSAJE = 'El código no tiene un formato válido.';
const MENSAJE_SERVICIO_NO_DISPONIBLE =
  'El servicio de verificación no está disponible en este momento. Intenta más tarde.';

const ESTADOS: Record<EstadoVerificacion, EstadoInfo> = {
  valida_vigente: {
    titulo: 'Credencial válida y vigente',
    etiquetaCorta: 'Verificada',
    variante: 'success',
    icon: 'verificada',
  },
  valida_vencida: {
    titulo: 'Credencial válida pero vencida',
    etiquetaCorta: 'Vencida',
    variante: 'warning',
    icon: 'vencida',
  },
  revocada: {
    titulo: 'Credencial revocada',
    etiquetaCorta: 'Revocada',
    variante: 'danger',
    icon: 'revocada',
  },
};

const NO_ENCONTRADA_INFO: EstadoInfo = {
  titulo: 'Credencial no encontrada',
  etiquetaCorta: 'Sin coincidencias',
  variante: 'neutral',
  icon: 'no-encontrada',
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
    SemanticCardComponent,
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
  protected readonly consultaFallida = signal<string | null>(null);

  protected readonly noEncontradaInfo = NO_ENCONTRADA_INFO;

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
      void this.verificar(normalizarCodigo(codigo));
    }
  }

  protected infoEstado(estado: EstadoVerificacion): EstadoInfo {
    return ESTADOS[estado];
  }

  protected esInsignia(categoria: string): boolean {
    return categoria === 'INSIGNIA';
  }

  protected nivelLabel(nivel: string | null): string {
    const labels: Record<string, string> = { bronce: 'Bronce', plata: 'Plata', oro: 'Oro' };
    return nivel ? (labels[nivel] ?? nivel) : '';
  }

  protected nivelIcono(nivel: string | null): IconName {
    const iconos: Record<string, IconName> = {
      bronce: 'medal-bronze',
      plata: 'medal-silver',
      oro: 'medal-gold',
    };
    return (nivel && iconos[nivel]) || 'insignias';
  }

  protected esVencida(estado: EstadoVerificacion): boolean {
    return estado === 'valida_vencida';
  }

  protected esRevocada(estado: EstadoVerificacion): boolean {
    return estado === 'revocada';
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  protected reintentar(): void {
    const codigo = this.codigo();
    if (codigo) void this.verificar(normalizarCodigo(codigo));
  }

  protected verificarOtra(): void {
    void this.router.navigateByUrl('/verificar');
  }

  private async onSubmit(): Promise<void> {
    await submit(this.verificarForm, {
      action: async (field) => {
        const codigo = normalizarCodigo(field().value().codigo);
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
    this.consultaFallida.set(null);
    this.resultado.set(null);
    try {
      const resultado = await firstValueFrom(this.verificacionPublicaService.verificar(codigo));
      this.resultado.set(resultado);
    } catch (err: unknown) {
      this.consultaFallida.set(fechaDelError(err));
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

// Normaliza tanto el código enviado por el formulario como el que llega por
// ruta directa (/verificar/:codigo), que puede venir en minúsculas o con
// espacios y el backend solo acepta en mayúsculas.
function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase();
}

// El backend timbra cada error (incluido el 404) con su propio timestamp
// (ApiErrorDTO); se usa ese en vez del reloj del navegador para que la hora
// de "Consulta" sea siempre la del servidor, igual que en un resultado exitoso.
function fechaDelError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const timestamp = (err.error as Record<string, unknown> | null)?.['timestamp'];
    if (typeof timestamp === 'string') return timestamp;
  }
  return new Date().toISOString();
}
