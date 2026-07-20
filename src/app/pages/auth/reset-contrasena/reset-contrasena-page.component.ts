import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
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
  validate,
} from '@angular/forms/signals';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { PasswordInputComponent } from '../../../shared/components/inputs/password-input/password-input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LinkDirective } from '../../../shared/components/link/link.directive';
import { AuthService } from '../../../core/auth/auth.service';
import {
  CONTRASENA_HINT,
  CONTRASENA_MENSAJE,
  CONTRASENA_PATTERN,
} from '../../../shared/utils/password.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';

interface RestablecerContrasenaFormModel {
  contrasena: string;
  confirmarContrasena: string;
}

@Component({
  selector: 'app-reset-contrasena-page',
  imports: [
    FormField,
    AuthLayoutComponent,
    RouterLink,
    LinkDirective,
    HeadingComponent,
    BadgeComponent,
    PasswordInputComponent,
    ButtonComponent,
  ],
  templateUrl: './reset-contrasena-page.component.html',
  styleUrl: './reset-contrasena-page.component.scss',
})
export class ResetContrasenaPageComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly token = input('');

  protected readonly cargando = signal(true);
  protected readonly email = signal('');
  protected readonly mensajeInvalido = signal('');
  protected readonly completado = signal(false);
  protected readonly mensajeExito = signal('');
  protected readonly error = signal('');

  protected readonly model = signal<RestablecerContrasenaFormModel>({
    contrasena: '',
    confirmarContrasena: '',
  });

  protected readonly restablecerForm = form(
    this.model,
    schema<RestablecerContrasenaFormModel>((path) => {
      required(path.contrasena, { message: 'Ingresa tu contraseña.' });
      pattern(path.contrasena, CONTRASENA_PATTERN, { message: CONTRASENA_MENSAJE });

      required(path.confirmarContrasena, { message: 'Debes confirmar tu contraseña.' });
      validate(path.confirmarContrasena, ({ value, valueOf }) => {
        if (!value()) return undefined;
        if (value() !== valueOf(path.contrasena)) {
          return { kind: 'confirmMismatch', message: 'Las contraseñas no coinciden.' };
        }
        return undefined;
      });

      disabled(path.contrasena, { when: () => this.submitting() });
      disabled(path.confirmarContrasena, { when: () => this.submitting() });
    })
  );

  protected readonly contrasenaHint = CONTRASENA_HINT;
  protected readonly errorContrasena = computed(() =>
    fieldError(this.restablecerForm.contrasena())
  );
  protected readonly errorConfirmacion = computed(() =>
    fieldError(this.restablecerForm.confirmarContrasena())
  );
  protected readonly submitting = computed(() => this.restablecerForm().submitting());

  ngOnInit(): void {
    if (!this.token()) {
      this.cargando.set(false);
      this.mensajeInvalido.set('Este enlace no es válido o expiró.');
      return;
    }

    this.authService.validarTokenReset(this.token()).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.email.set(respuesta.email);
      },
      error: (err) => {
        this.cargando.set(false);
        const message = err?.error?.message;
        this.mensajeInvalido.set(message ?? 'Este enlace no es válido o expiró.');
      },
    });
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async onSubmit(): Promise<void> {
    this.error.set('');

    await submit(this.restablecerForm, {
      action: async (field) => {
        const value = field().value();
        try {
          const respuesta = await firstValueFrom(
            this.authService.restablecerContrasena(
              this.token(),
              value.contrasena,
              value.confirmarContrasena
            )
          );
          this.mensajeExito.set(respuesta.mensaje);
          this.completado.set(true);
        } catch (err: unknown) {
          const message = (err as { error?: { message?: string } })?.error?.message;
          this.error.set(message ?? 'No pudimos actualizar tu contraseña. Intenta nuevamente.');
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }
}
