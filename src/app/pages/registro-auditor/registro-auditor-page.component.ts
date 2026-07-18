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
import { disabled, form, FormField, minLength, pattern, required, schema, submit, validate } from '@angular/forms/signals';
import { AuthLayoutComponent } from '../../shared/layouts/auth-layout/auth-layout.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { HeadingComponent } from '../../shared/components/heading/heading.component';
import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import { AuthService } from '../../core/auth/auth.service';
import { GoogleIdentityService } from '../../core/auth/google-identity.service';
import { AuthResponse } from '../../core/auth/auth.models';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegistroAuditorFormModel {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  confirmarContrasena: string;
  aceptaTerminos: boolean;
}

@Component({
  selector: 'app-registro-auditor-page',
  imports: [
    FormField,
    AuthLayoutComponent,
    BadgeComponent,
    ButtonComponent,
    HeadingComponent,
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

  protected readonly cargando = signal(false);

  protected readonly model = signal<RegistroAuditorFormModel>({
    nombre: '',
    apellidos: '',
    email: '',
    contrasena: '',
    confirmarContrasena: '',
    aceptaTerminos: false,
  });

  protected readonly registroForm = form(
    this.model,
    schema<RegistroAuditorFormModel>((path) => {
      required(path.nombre, { message: 'El nombre es obligatorio.' });
      required(path.apellidos, { message: 'Los apellidos son obligatorios.' });

      required(path.email, { message: 'El correo electrónico es obligatorio.' });
      pattern(path.email, EMAIL_PATTERN, { message: 'Ingresa un correo electrónico válido.' });

      required(path.contrasena, { message: 'La contraseña es obligatoria.' });
      minLength(path.contrasena, 8, {
        message: 'La contraseña debe tener al menos 8 caracteres.',
      });

      required(path.confirmarContrasena, { message: 'Confirma tu contraseña.' });
      validate(path.confirmarContrasena, ({ value, valueOf }) => {
        if (!value()) return undefined;
        if (value() !== valueOf(path.contrasena)) {
          return { kind: 'confirmMismatch', message: 'Las contraseñas no coinciden.' };
        }
        return undefined;
      });

      required(path.aceptaTerminos, { message: 'Debes aceptar los términos y condiciones.' });

      disabled(path.nombre, { when: () => this.cargando() });
      disabled(path.apellidos, { when: () => this.cargando() });
      disabled(path.email, { when: () => this.cargando() });
      disabled(path.contrasena, { when: () => this.cargando() });
      disabled(path.confirmarContrasena, { when: () => this.cargando() });
      disabled(path.aceptaTerminos, { when: () => this.cargando() });
    })
  );

  protected readonly errorGeneral = signal('');
  protected readonly serverErrorEmail = signal('');

  protected readonly errorNombre = computed(() => this.fieldError(this.registroForm.nombre()));
  protected readonly errorApellidos = computed(() =>
    this.fieldError(this.registroForm.apellidos())
  );
  protected readonly errorEmail = computed(
    () => this.serverErrorEmail() || this.fieldError(this.registroForm.email())
  );
  protected readonly errorContrasena = computed(() =>
    this.fieldError(this.registroForm.contrasena())
  );
  protected readonly errorConfirmar = computed(() =>
    this.fieldError(this.registroForm.confirmarContrasena())
  );
  protected readonly errorTerminos = computed(() =>
    this.fieldError(this.registroForm.aceptaTerminos())
  );

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

    this.errorGeneral.set('');
    this.serverErrorEmail.set('');

    void submit(this.registroForm, {
      action: async (field) => {
        const value = field().value();
        this.cargando.set(true);
        this.authService
          .registrarAuditorCorreo({
            nombre: value.nombre.trim(),
            apellidos: value.apellidos.trim(),
            email: value.email.trim(),
            contrasena: value.contrasena,
            aceptaTerminos: value.aceptaTerminos,
          })
          .subscribe({
            next: () => {
              this.cargando.set(false);
              void this.router.navigateByUrl('/validacion-pendiente');
            },
            error: (err) => {
              this.cargando.set(false);
              if (err?.status === 409) {
                this.serverErrorEmail.set(
                  err?.error?.message ?? 'Ya existe una cuenta con este correo electrónico.'
                );
              } else {
                this.errorGeneral.set(
                  err?.error?.message ?? 'No pudimos completar tu registro. Intenta nuevamente.'
                );
              }
            },
          });
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private registrarConGoogle(idToken: string): void {
    if (!this.model().aceptaTerminos) {
      this.registroForm.aceptaTerminos().markAsTouched();
      return;
    }
    this.cargando.set(true);
    this.errorGeneral.set('');
    this.serverErrorEmail.set('');
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

  private fieldError(field: {
    touched(): boolean;
    errors(): readonly { message?: string }[];
  }): string {
    if (!field.touched()) return '';
    return field.errors()[0]?.message ?? '';
  }
}
