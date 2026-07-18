import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/auth/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTRASENA_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

interface RegistroUsuarioFormModel {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  confirmarContrasena: string;
  aceptaTerminos: boolean;
}

const INITIAL_MODEL: RegistroUsuarioFormModel = {
  nombre: '',
  apellidos: '',
  email: '',
  contrasena: '',
  confirmarContrasena: '',
  aceptaTerminos: false,
};

@Component({
  selector: 'app-registro-usuario-form',
  imports: [
    FormField,
    ButtonComponent,
    TextInputComponent,
    CheckboxComponent,
    IconComponent,
    RouterLink,
  ],
  templateUrl: './registro-usuario-form.component.html',
  styleUrl: './registro-usuario-form.component.scss',
})
export class RegistroUsuarioFormComponent {
  private readonly authService = inject(AuthService);

  protected readonly model = signal<RegistroUsuarioFormModel>({ ...INITIAL_MODEL });

  protected readonly registroForm = form(
    this.model,
    schema<RegistroUsuarioFormModel>((path) => {
      required(path.nombre, { message: 'Ingresa tu nombre.' });
      required(path.apellidos, { message: 'Ingresa tus apellidos.' });

      required(path.email, { message: 'Ingresa un correo electrónico válido.' });
      pattern(path.email, EMAIL_PATTERN, { message: 'Ingresa un correo electrónico válido.' });

      required(path.contrasena, { message: 'Ingresa tu contraseña.' });
      pattern(path.contrasena, CONTRASENA_PATTERN, {
        message: 'La contraseña debe tener al menos 8 caracteres, con una letra y un número.',
      });

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

  protected readonly mostrarContrasena = signal(false);
  protected readonly mostrarConfirmar = signal(false);

  protected readonly error = signal('');
  protected readonly enviado = signal(false);
  protected readonly correoEnviado = signal('');

  protected readonly errorNombre = computed(() => this.fieldError(this.registroForm.nombre()));
  protected readonly errorApellidos = computed(() =>
    this.fieldError(this.registroForm.apellidos())
  );
  protected readonly errorEmail = computed(() => this.fieldError(this.registroForm.email()));
  protected readonly errorContrasena = computed(() =>
    this.fieldError(this.registroForm.contrasena())
  );
  protected readonly errorConfirmacion = computed(() =>
    this.fieldError(this.registroForm.confirmarContrasena())
  );
  protected readonly errorTerminos = computed(() =>
    this.fieldError(this.registroForm.aceptaTerminos())
  );

  protected readonly submitting = computed(() => this.registroForm().submitting());

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((v) => !v);
  }

  protected alternarConfirmar(): void {
    this.mostrarConfirmar.update((v) => !v);
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async onSubmit(): Promise<void> {
    await submit(this.registroForm, async (field) => {
      const value = field().value();
      try {
        const respuesta = await firstValueFrom(
          this.authService.registrarUsuarioConCorreo({
            nombre: value.nombre.trim(),
            apellidos: value.apellidos.trim(),
            email: value.email.trim(),
            contrasena: value.contrasena,
            confirmarContrasena: value.confirmarContrasena,
            aceptaTerminos: value.aceptaTerminos,
          })
        );
        this.error.set('');
        this.correoEnviado.set(respuesta.email);
        this.enviado.set(true);
      } catch (err: unknown) {
        this.error.set(
          (err as { error?: { message?: string } })?.error?.message ??
            'No pudimos completar tu registro. Intenta nuevamente.'
        );
      }
      return undefined;
    });
  }

  private fieldError(field: {
    touched(): boolean;
    errors(): readonly { message?: string }[];
  }): string {
    if (!field.touched()) return '';
    return field.errors()[0]?.message ?? '';
  }
}
