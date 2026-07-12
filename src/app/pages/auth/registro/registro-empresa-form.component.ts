import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-registro-empresa-form',
  imports: [ButtonComponent, TextInputComponent, CheckboxComponent, IconComponent, RouterLink],
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
    this.errorConfirmacion.set('');

    if (!this.nombreAdmin().trim() || !this.apellidosAdmin().trim()) {
      this.error.set('Ingresa el nombre y apellidos del administrador.');
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
