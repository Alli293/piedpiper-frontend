import {
  Component,
  ElementRef,
  NgZone,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../shared/layouts/auth-layout/auth-layout.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import { AuthService } from '../../core/auth/auth.service';
import { GoogleIdentityService } from '../../core/auth/google-identity.service';
import { AuthResponse } from '../../core/auth/auth.models';

@Component({
  selector: 'app-registro-auditor-page',
  imports: [
    AuthLayoutComponent,
    ButtonComponent,
    TextInputComponent,
    CheckboxComponent,
    RouterLink,
  ],
  templateUrl: './registro-auditor-page.component.html',
  styleUrl: './registro-auditor-page.component.scss',
})
export class RegistroAuditorPageComponent {
  private readonly authService = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  private readonly googleButton = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  protected readonly nombre = signal('');
  protected readonly apellidos = signal('');
  protected readonly email = signal('');
  protected readonly contrasena = signal('');
  protected readonly confirmarContrasena = signal('');
  protected readonly aceptaTerminos = signal(false);

  protected readonly cargando = signal(false);
  protected readonly errorGeneral = signal('');
  protected readonly errorEmail = signal('');
  protected readonly errorNombre = signal('');
  protected readonly errorApellidos = signal('');
  protected readonly errorContrasena = signal('');
  protected readonly errorConfirmar = signal('');
  protected readonly errorTerminos = signal('');

  constructor() {
    afterNextRender(() => {
      this.googleIdentity
        .renderizarBoton(
          this.googleButton().nativeElement,
          (idToken) => this.zone.run(() => this.registrarConGoogle(idToken)),
          'signup_with'
        )
        .catch(() => this.errorGeneral.set('No se pudo cargar el registro con Google.'));
    });
  }

  protected enviar(event?: Event): void {
    event?.preventDefault();
    if (this.cargando()) return;

    this.limpiarErrores();

    if (!this.validar()) return;

    this.cargando.set(true);
    this.authService
      .registrarAuditorCorreo({
        nombre: this.nombre().trim(),
        apellidos: this.apellidos().trim(),
        email: this.email().trim(),
        contrasena: this.contrasena(),
        aceptaTerminos: this.aceptaTerminos(),
      })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          void this.router.navigateByUrl('/validacion-pendiente');
        },
        error: (err) => {
          this.cargando.set(false);
          if (err?.status === 409) {
            this.errorEmail.set(
              err?.error?.message ?? 'Ya existe una cuenta con este correo electrónico.'
            );
          } else {
            this.errorGeneral.set(
              err?.error?.message ?? 'No pudimos completar tu registro. Intenta nuevamente.'
            );
          }
        },
      });
  }

  private registrarConGoogle(idToken: string): void {
    if (!this.aceptaTerminos()) {
      this.errorTerminos.set('Debes aceptar los términos y condiciones.');
      return;
    }
    this.cargando.set(true);
    this.limpiarErrores();
    this.authService.registrarConGoogle('auditor', idToken).subscribe({
      next: (respuesta: AuthResponse) => {
        this.cargando.set(false);
        this.router.navigateByUrl(respuesta.redirect || '/').catch(() => {
          this.errorGeneral.set('No pudimos abrir tu panel. Intenta nuevamente.');
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorGeneral.set(
          err?.error?.message ?? 'No pudimos completar tu registro. Intenta nuevamente.'
        );
      },
    });
  }

  private validar(): boolean {
    let valido = true;

    if (!this.nombre().trim()) {
      this.errorNombre.set('El nombre es obligatorio.');
      valido = false;
    }

    if (!this.apellidos().trim()) {
      this.errorApellidos.set('Los apellidos son obligatorios.');
      valido = false;
    }

    if (!this.email().trim()) {
      this.errorEmail.set('El correo electrónico es obligatorio.');
      valido = false;
    } else if (!this.esEmailValido(this.email().trim())) {
      this.errorEmail.set('Ingresa un correo electrónico válido.');
      valido = false;
    }

    if (!this.contrasena()) {
      this.errorContrasena.set('La contraseña es obligatoria.');
      valido = false;
    } else if (this.contrasena().length < 8) {
      this.errorContrasena.set('La contraseña debe tener al menos 8 caracteres.');
      valido = false;
    }

    if (!this.confirmarContrasena()) {
      this.errorConfirmar.set('Confirma tu contraseña.');
      valido = false;
    } else if (this.contrasena() !== this.confirmarContrasena()) {
      this.errorConfirmar.set('Las contraseñas no coinciden.');
      valido = false;
    }

    if (!this.aceptaTerminos()) {
      this.errorTerminos.set('Debes aceptar los términos y condiciones.');
      valido = false;
    }

    return valido;
  }

  private esEmailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private limpiarErrores(): void {
    this.errorGeneral.set('');
    this.errorEmail.set('');
    this.errorNombre.set('');
    this.errorApellidos.set('');
    this.errorContrasena.set('');
    this.errorConfirmar.set('');
    this.errorTerminos.set('');
  }
}
