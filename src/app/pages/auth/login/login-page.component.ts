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
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { AuthResponse } from '../../../core/auth/auth.models';

@Component({
  selector: 'app-login-page',
  imports: [AuthLayoutComponent, ButtonComponent, TextInputComponent, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  private readonly googleButton = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  protected readonly email = signal('');
  protected readonly contrasena = signal('');
  protected readonly mostrarContrasena = signal(false);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  constructor() {
    afterNextRender(() => {
      this.googleIdentity
        .renderizarBoton(this.googleButton().nativeElement, (idToken) =>
          this.zone.run(() => this.autenticar(this.authService.loginConGoogle(idToken)))
        )
        .catch(() => this.error.set('No se pudo cargar el inicio de sesión con Google.'));
    });
  }

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((v) => !v);
  }

  protected enviar(event?: Event): void {
    event?.preventDefault();
    if (this.cargando()) {
      return;
    }
    if (!this.email().trim() || !this.contrasena()) {
      this.error.set('Ingresa tu correo y contraseña.');
      return;
    }
    this.autenticar(this.authService.loginConCorreo(this.email().trim(), this.contrasena()));
  }

  private autenticar(peticion: ReturnType<AuthService['loginConCorreo']>): void {
    this.cargando.set(true);
    this.error.set('');
    peticion.subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.redirigir(respuesta);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos iniciar sesión. Intenta nuevamente.');
      },
    });
  }

  private redirigir(respuesta: AuthResponse): void {
    this.router.navigateByUrl(respuesta.redirect || '/');
  }
}
