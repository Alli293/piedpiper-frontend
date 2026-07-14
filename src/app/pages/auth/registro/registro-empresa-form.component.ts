import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SemanticCardComponent } from '../../../shared/components/semantic-card/semantic-card.component';
import { AuthService } from '../../../core/auth/auth.service';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTRASENA_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

@Component({
  selector: 'app-registro-empresa-form',
  imports: [
    ButtonComponent,
    TextInputComponent,
    CheckboxComponent,
    IconComponent,
    SemanticCardComponent,
    RouterLink,
  ],
  templateUrl: './registro-empresa-form.component.html',
  styleUrl: './registro-empresa-form.component.scss',
})
export class RegistroEmpresaFormComponent {
  private readonly authService = inject(AuthService);

  protected readonly nombreAdmin = signal('');
  protected readonly apellidosAdmin = signal('');
  protected readonly email = signal('');
  protected readonly contrasena = signal('');
  protected readonly confirmarContrasena = signal('');
  protected readonly aceptaTerminos = signal(false);

  protected readonly mostrarContrasena = signal(false);
  protected readonly mostrarConfirmar = signal(false);

  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly errorNombreAdmin = signal('');
  protected readonly errorApellidosAdmin = signal('');
  protected readonly errorEmail = signal('');
  protected readonly errorContrasena = signal('');
  protected readonly errorConfirmacion = signal('');
  protected readonly enviado = signal(false);
  protected readonly correoEnviado = signal('');

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((v) => !v);
  }

  protected alternarConfirmar(): void {
    this.mostrarConfirmar.update((v) => !v);
  }

  protected enviar(event?: Event): void {
    event?.preventDefault();
    if (this.cargando()) {
      return;
    }
    if (!this.validar()) {
      return;
    }

    this.cargando.set(true);
    this.authService
      .registrarEmpresaConCorreo({
        nombreAdmin: this.nombreAdmin().trim(),
        apellidosAdmin: this.apellidosAdmin().trim(),
        emailAdmin: this.email().trim(),
        contrasena: this.contrasena(),
        confirmarContrasena: this.confirmarContrasena(),
        aceptaTerminos: this.aceptaTerminos(),
      })
      .subscribe({
        next: (respuesta) => {
          this.cargando.set(false);
          this.correoEnviado.set(respuesta.email);
          this.enviado.set(true);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(
            err?.error?.message ?? 'No pudimos completar tu registro. Intenta nuevamente.'
          );
        },
      });
  }

  private validar(): boolean {
    this.error.set('');
    this.errorNombreAdmin.set('');
    this.errorApellidosAdmin.set('');
    this.errorEmail.set('');
    this.errorContrasena.set('');
    this.errorConfirmacion.set('');

    let esValido = true;

    if (!this.nombreAdmin().trim()) {
      this.errorNombreAdmin.set('Ingresa el nombre del administrador.');
      esValido = false;
    }
    if (!this.apellidosAdmin().trim()) {
      this.errorApellidosAdmin.set('Ingresa los apellidos del administrador.');
      esValido = false;
    }
    if (!this.email().trim()) {
      this.errorEmail.set('Ingresa un correo electrónico válido.');
      esValido = false;
    } else if (!EMAIL_PATTERN.test(this.email().trim())) {
      this.errorEmail.set('Ingresa un correo electrónico válido.');
      esValido = false;
    }
    if (!this.contrasena()) {
      this.errorContrasena.set('Ingresa tu contraseña.');
      esValido = false;
    } else if (!CONTRASENA_PATTERN.test(this.contrasena())) {
      this.errorContrasena.set(
        'La contraseña debe tener al menos 8 caracteres, con una letra y un número.'
      );
      esValido = false;
    }
    if (!this.confirmarContrasena()) {
      this.errorConfirmacion.set('Debes confirmar tu contraseña.');
      esValido = false;
    } else if (this.contrasena() && this.contrasena() !== this.confirmarContrasena()) {
      this.errorConfirmacion.set('Las contraseñas no coinciden.');
      esValido = false;
    }
    if (!this.aceptaTerminos()) {
      this.error.set('Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
      esValido = false;
    }

    return esValido;
  }
}
