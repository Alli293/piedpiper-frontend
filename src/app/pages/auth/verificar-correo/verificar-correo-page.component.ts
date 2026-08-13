import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  FormField,
  disabled,
  form,
  pattern,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { StateLayoutComponent } from '../../../shared/layouts/state-layout/state-layout.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { SemanticCardComponent } from '../../../shared/components/semantic-card/semantic-card.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AuthService } from '../../../core/auth/auth.service';
import { EnlaceUnSoloUsoService } from '../../../core/auth/enlace-un-solo-uso.service';
import { EMAIL_MENSAJE, EMAIL_PATTERN } from '../../../shared/utils/email.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';

interface ReenviarVerificacionFormModel {
  email: string;
}

@Component({
  selector: 'app-verificar-correo-page',
  imports: [
    FormField,
    RouterLink,
    StateLayoutComponent,
    CardComponent,
    SemanticCardComponent,
    TextInputComponent,
    ButtonComponent,
  ],
  templateUrl: './verificar-correo-page.component.html',
  styleUrl: './verificar-correo-page.component.scss',
})
export class VerificarCorreoPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly enlaceUnSoloUso = inject(EnlaceUnSoloUsoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly token = input('');

  protected readonly cargando = signal(true);
  protected readonly mensajeExito = signal('');
  protected readonly mensajeInvalido = signal('');

  protected readonly reenviarMensaje = signal('');
  protected readonly reenviarError = signal('');

  protected readonly reenviarModel = signal<ReenviarVerificacionFormModel>({ email: '' });

  protected readonly reenviarForm = form(
    this.reenviarModel,
    schema<ReenviarVerificacionFormModel>((path) => {
      required(path.email, { message: EMAIL_MENSAJE });
      pattern(path.email, EMAIL_PATTERN, { message: EMAIL_MENSAJE });
      disabled(path.email, { when: () => this.reenviarEnviando() });
    })
  );

  protected readonly errorReenviarEmail = computed(() => fieldError(this.reenviarForm.email()));
  protected readonly reenviarEnviando = computed(() => this.reenviarForm().submitting());

  ngOnInit(): void {
    const tokenLimpio = this.enlaceUnSoloUso.consumir(this.token());
    if (!tokenLimpio) {
      this.cargando.set(false);
      this.mensajeInvalido.set('Este enlace de verificación no es válido.');
      return;
    }

    this.authService
      .verificarCorreo(tokenLimpio)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.cargando.set(false);
          this.mensajeExito.set(respuesta.mensaje);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          const mensaje =
            apiErrorMessage(err) ?? 'Este enlace de verificación no es válido o expiró.';
          if (err.status === 409) {
            this.mensajeExito.set(mensaje);
          } else {
            this.mensajeInvalido.set(mensaje);
          }
        },
      });
  }

  protected handleReenviarSubmit(event: Event): void {
    event.preventDefault();
    void this.onReenviarSubmit();
  }

  private async onReenviarSubmit(): Promise<void> {
    this.reenviarMensaje.set('');
    this.reenviarError.set('');

    await submit(this.reenviarForm, {
      action: async (field) => {
        const value = field().value();
        try {
          const respuesta = await firstValueFrom(
            this.authService
              .reenviarVerificacion(value.email.trim())
              .pipe(takeUntilDestroyed(this.destroyRef))
          );
          this.reenviarMensaje.set(respuesta.mensaje);
        } catch (err: unknown) {
          this.reenviarError.set(
            apiErrorMessage(err) ?? 'No pudimos reenviar el enlace. Intenta nuevamente.'
          );
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }
}
