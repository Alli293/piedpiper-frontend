import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  form,
  FormField,
  pattern,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { PasswordInputComponent } from '../../../shared/components/inputs/password-input/password-input.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import { LinkDirective } from '../../../shared/components/link/link.directive';
import { AuthService } from '../../../core/auth/auth.service';
import {
  CONTRASENA_HINT,
  CONTRASENA_MENSAJE,
  CONTRASENA_PATTERN,
} from '../../../shared/utils/password.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';

interface RegistroInvitacionCorreoFormModel {
  nombre: string;
  apellidos: string;
  contrasena: string;
  confirmarContrasena: string;
  aceptaTerminos: boolean;
}

const INITIAL_MODEL: RegistroInvitacionCorreoFormModel = {
  nombre: '',
  apellidos: '',
  contrasena: '',
  confirmarContrasena: '',
  aceptaTerminos: false,
};

@Component({
  selector: 'app-registro-invitacion-correo-form',
  imports: [
    FormField,
    ButtonComponent,
    TextInputComponent,
    PasswordInputComponent,
    CheckboxComponent,
    RouterLink,
    LinkDirective,
  ],
  templateUrl: './registro-invitacion-correo-form.component.html',
  styleUrl: './registro-invitacion-correo-form.component.scss',
})
export class RegistroInvitacionCorreoFormComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = input.required<string>();
  readonly token = input.required<string>();

  protected readonly model = signal<RegistroInvitacionCorreoFormModel>({ ...INITIAL_MODEL });

  protected readonly registroForm = form(
    this.model,
    schema<RegistroInvitacionCorreoFormModel>((path) => {
      required(path.nombre, { message: 'Ingresa tu nombre.' });
      required(path.apellidos, { message: 'Ingresa tus apellidos.' });

      required(path.contrasena, { message: 'Ingresa tu contraseña.' });
      pattern(path.contrasena, CONTRASENA_PATTERN, { message: CONTRASENA_MENSAJE });

      required(path.confirmarContrasena, { message: 'Debes confirmar tu contraseña.' });
      validate(path.confirmarContrasena, ({ value, valueOf }) => {
        const confirmacion = value();
        if (!confirmacion) {
          return undefined;
        }
        if (confirmacion !== valueOf(path.contrasena)) {
          return { kind: 'confirmMismatch', message: 'Las contraseñas no coinciden.' };
        }
        return undefined;
      });

      required(path.aceptaTerminos, {
        message: 'Debes aceptar los Términos y Condiciones y la Política de Privacidad.',
      });
    })
  );

  protected readonly contrasenaHint = CONTRASENA_HINT;

  protected readonly error = signal('');
  protected readonly cuentaExistente = signal(false);

  protected readonly errorNombre = computed(() => fieldError(this.registroForm.nombre()));
  protected readonly errorApellidos = computed(() => fieldError(this.registroForm.apellidos()));
  protected readonly errorContrasena = computed(() => fieldError(this.registroForm.contrasena()));
  protected readonly errorConfirmacion = computed(() =>
    fieldError(this.registroForm.confirmarContrasena())
  );
  protected readonly errorTerminos = computed(() => fieldError(this.registroForm.aceptaTerminos()));

  protected readonly submitting = computed(() => this.registroForm().submitting());

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async onSubmit(): Promise<void> {
    this.error.set('');
    this.cuentaExistente.set(false);

    await submit(this.registroForm, {
      action: async (field) => {
        const value = field().value();
        try {
          const respuesta = await firstValueFrom(
            this.authService.registrarInvitacionConCorreo(this.token(), {
              nombre: value.nombre.trim(),
              apellidos: value.apellidos.trim(),
              contrasena: value.contrasena,
              confirmarContrasena: value.confirmarContrasena,
              aceptaTerminos: value.aceptaTerminos,
            })
          );
          this.router.navigateByUrl(respuesta.redirect || '/').catch(() => {
            this.error.set('No pudimos abrir tu panel. Intenta nuevamente.');
          });
        } catch (err: unknown) {
          this.cuentaExistente.set(err instanceof HttpErrorResponse && err.status === 409);
          this.error.set(
            apiErrorMessage(err) ?? 'No pudimos completar tu registro. Intenta nuevamente.'
          );
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }
}
