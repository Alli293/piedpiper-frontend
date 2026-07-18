import {
  Component,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  disabled,
  form,
  FormField,
  pattern,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { AuthResponse } from '../../../core/auth/auth.models';
import { EMAIL_MENSAJE, EMAIL_PATTERN } from '../../../shared/utils/email.utils';

interface LoginFormModel {
  email: string;
  contrasena: string;
}

const REQUIRED_MESSAGE = 'Ingresa tu correo y contraseña.';

@Component({
  selector: 'app-login-page',
  imports: [
    FormField,
    AuthLayoutComponent,
    ButtonComponent,
    HeadingComponent,
    TextInputComponent,
    IconComponent,
    RouterLink,
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  private readonly googleButton = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  protected readonly model = signal<LoginFormModel>({ email: '', contrasena: '' });

  protected readonly loginForm = form(
    this.model,
    schema<LoginFormModel>((path) => {
      required(path.email, { message: REQUIRED_MESSAGE });
      pattern(path.email, EMAIL_PATTERN, { message: EMAIL_MENSAJE });
      required(path.contrasena, { message: REQUIRED_MESSAGE });
      disabled(path.email, { when: () => this.cargando() });
      disabled(path.contrasena, { when: () => this.cargando() });
    })
  );

  protected readonly mostrarContrasena = signal(false);
  protected readonly cargando = signal(false);
  protected readonly serverError = signal('');

  protected readonly error = computed(() => {
    if (this.serverError()) return this.serverError();
    const email = this.loginForm.email();
    if (email.touched() && email.invalid()) {
      return email.errors()[0]?.message ?? REQUIRED_MESSAGE;
    }
    const contrasena = this.loginForm.contrasena();
    if (contrasena.touched() && contrasena.invalid()) {
      return REQUIRED_MESSAGE;
    }
    return '';
  });

  constructor() {
    afterNextRender(() => {
      this.googleIdentity
        .renderizarBoton(this.googleButton().nativeElement, (idToken) =>
          this.zone.run(() => this.autenticar(this.authService.loginConGoogle(idToken)))
        )
        .catch(() => this.serverError.set('No se pudo cargar el inicio de sesión con Google.'));
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
    void submit(this.loginForm, {
      action: async (field) => {
        const value = field().value();
        this.autenticar(this.authService.loginConCorreo(value.email.trim(), value.contrasena));
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private autenticar(peticion: ReturnType<AuthService['loginConCorreo']>): void {
    this.cargando.set(true);
    this.serverError.set('');
    peticion.subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.redirigir(respuesta);
      },
      error: (err) => {
        this.cargando.set(false);
        this.serverError.set(
          err?.error?.message ?? 'No pudimos iniciar sesión. Intenta nuevamente.'
        );
      },
    });
  }

  private redirigir(respuesta: AuthResponse): void {
    this.router.navigateByUrl(respuesta.redirect || '/').catch(() => {
      this.serverError.set('No pudimos abrir tu panel. Intenta nuevamente.');
    });
  }
}
