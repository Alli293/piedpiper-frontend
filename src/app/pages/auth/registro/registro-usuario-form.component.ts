import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-registro-usuario-form',
  imports: [ButtonComponent, TextInputComponent, CheckboxComponent, IconComponent, RouterLink],
  templateUrl: './registro-usuario-form.component.html',
  styleUrl: './registro-usuario-form.component.scss',
})
export class RegistroUsuarioFormComponent {
  private readonly authService = inject(AuthService);

  protected readonly nombre = signal('');
  protected readonly apellidos = signal('');
  protected readonly email = signal('');
  protected readonly contrasena = signal('');
  protected readonly confirmarContrasena = signal('');
  protected readonly aceptaTerminos = signal(false);

  protected readonly mostrarContrasena = signal(false);
  protected readonly mostrarConfirmar = signal(false);

  protected readonly cargando = signal(false);
  protected readonly error = signal('');
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
      .registrarUsuarioConCorreo({
        nombre: this.nombre().trim(),
        apellidos: this.apellidos().trim(),
        email: this.email().trim(),
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
    this.errorConfirmacion.set('');

    if (!this.nombre().trim() || !this.apellidos().trim()) {
      this.error.set('Ingresa tu nombre y apellidos.');
      return false;
    }
    if (!this.email().trim()) {
      this.error.set('Ingresa un correo electrónico válido.');
      return false;
    }
    if (!this.contrasena() || !this.confirmarContrasena()) {
      this.error.set('Ingresa y confirma tu contraseña.');
      return false;
    }
    if (this.contrasena() !== this.confirmarContrasena()) {
      this.errorConfirmacion.set('Las contraseñas no coinciden.');
      return false;
    }
    if (!this.aceptaTerminos()) {
      this.error.set('Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
      return false;
    }
    return true;
  }
}
