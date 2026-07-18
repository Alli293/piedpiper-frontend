import {
  Component,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import {
  disabled,
  form,
  FormField,
  pattern,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { AuthResponse } from '../../../core/auth/auth.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { PasswordInputComponent } from '../../../shared/components/inputs/password-input/password-input.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import {
  SemanticCardComponent,
  SemanticCardVariant,
} from '../../../shared/components/semantic-card/semantic-card.component';
import { LinkDirective } from '../../../shared/components/link/link.directive';
import {
  CONTRASENA_HINT,
  CONTRASENA_MENSAJE,
  CONTRASENA_PATTERN,
} from '../../../shared/utils/password.utils';
import { EMAIL_MENSAJE, EMAIL_PATTERN } from '../../../shared/utils/email.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';

type Rol = 'empresa' | 'auditor' | 'viajero';

interface RegistroFormModel {
  nombre: string;
  apellidos: string;
  email: string;
  contrasena: string;
  confirmarContrasena: string;
  aceptaTerminos: boolean;
}

interface ConfigRolCard {
  variant: SemanticCardVariant;
  title: string;
  text?: string;
  steps?: string[];
}

interface ConfigRol {
  tipo: 'usuario' | 'empresa' | 'auditor';
  icon: 'empresa' | 'auditor' | 'viajero';
  badge: string;
  titulo: string;
  subtitulo: string;
  emailPlaceholder: string;
  card?: ConfigRolCard;
  enviarCorreo: (
    authService: AuthService,
    value: RegistroFormModel
  ) => Observable<{ email: string }>;
}

const CONFIG: Record<Rol, ConfigRol> = {
  empresa: {
    tipo: 'empresa',
    icon: 'empresa',
    badge: 'EMPRESA · ADMINISTRADOR',
    titulo: 'Crea tu cuenta',
    subtitulo: 'Primero crea tu perfil personal. Luego configurarás los datos de tu empresa.',
    emailPlaceholder: 'tucorreo@empresa.com',
    card: {
      variant: 'info',
      title: 'Siguiente paso:',
      text: 'Al crear tu cuenta, te guiaremos para registrar tu empresa: nombre, sector y más.',
    },
    enviarCorreo: (authService, value) =>
      authService.registrarEmpresaConCorreo({
        nombreAdmin: value.nombre.trim(),
        apellidosAdmin: value.apellidos.trim(),
        emailAdmin: value.email.trim(),
        contrasena: value.contrasena,
        confirmarContrasena: value.confirmarContrasena,
        aceptaTerminos: value.aceptaTerminos,
      }),
  },
  auditor: {
    tipo: 'auditor',
    icon: 'auditor',
    badge: 'AUDITOR CERTIFICADO',
    titulo: 'Crea tu cuenta',
    subtitulo:
      'Empieza con tus datos personales. Enviarás tus credenciales una vez actives la cuenta.',
    emailPlaceholder: 'tucorreo@ejemplo.com',
    card: {
      variant: 'info',
      title: '¿Cómo funciona?',
      steps: [
        'Crea tu cuenta con tus datos personales.',
        'Verifica tu correo electrónico.',
        'Sube tus credenciales profesionales.',
        'El equipo de CarbonHub valida tu perfil.',
      ],
    },
    enviarCorreo: (authService, value) =>
      authService.registrarAuditorCorreo({
        nombre: value.nombre.trim(),
        apellidos: value.apellidos.trim(),
        email: value.email.trim(),
        contrasena: value.contrasena,
        aceptaTerminos: value.aceptaTerminos,
      }),
  },
  viajero: {
    tipo: 'usuario',
    icon: 'viajero',
    badge: 'VIAJERO SOSTENIBLE',
    titulo: 'Crea tu cuenta',
    subtitulo: 'Primero crea tu perfil personal. Luego podrás empezar a planificar tus rutas.',
    emailPlaceholder: 'tucorreo@ejemplo.com',
    enviarCorreo: (authService, value) =>
      authService.registrarUsuarioConCorreo({
        nombre: value.nombre.trim(),
        apellidos: value.apellidos.trim(),
        email: value.email.trim(),
        contrasena: value.contrasena,
        confirmarContrasena: value.confirmarContrasena,
        aceptaTerminos: value.aceptaTerminos,
      }),
  },
};

@Component({
  selector: 'app-registro-rol-page',
  imports: [
    FormField,
    AuthLayoutComponent,
    RouterLink,
    LinkDirective,
    BadgeComponent,
    HeadingComponent,
    ButtonComponent,
    TextInputComponent,
    PasswordInputComponent,
    CheckboxComponent,
    SemanticCardComponent,
  ],
  templateUrl: './registro-rol-page.component.html',
  styleUrl: './registro-rol-page.component.scss',
})
export class RegistroRolPageComponent {
  private readonly authService = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  readonly rol = input.required<string>();

  private readonly googleButton = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  protected readonly config = computed<ConfigRol | null>(
    () => (CONFIG as Record<string, ConfigRol>)[this.rol()] ?? null
  );

  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly serverErrorEmail = signal('');

  protected readonly model = signal<RegistroFormModel>({
    nombre: '',
    apellidos: '',
    email: '',
    contrasena: '',
    confirmarContrasena: '',
    aceptaTerminos: false,
  });

  protected readonly registroForm = form(
    this.model,
    schema<RegistroFormModel>((path) => {
      required(path.nombre, { message: 'Ingresa tu nombre.' });
      required(path.apellidos, { message: 'Ingresa tus apellidos.' });

      required(path.email, { message: EMAIL_MENSAJE });
      pattern(path.email, EMAIL_PATTERN, { message: EMAIL_MENSAJE });

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

      required(path.aceptaTerminos, {
        message: 'Debes aceptar los Términos y Condiciones y la Política de Privacidad.',
      });

      disabled(path.nombre, { when: () => this.cargando() });
      disabled(path.apellidos, { when: () => this.cargando() });
      disabled(path.email, { when: () => this.cargando() });
      disabled(path.contrasena, { when: () => this.cargando() });
      disabled(path.confirmarContrasena, { when: () => this.cargando() });
      disabled(path.aceptaTerminos, { when: () => this.cargando() });
    })
  );

  protected readonly contrasenaHint = CONTRASENA_HINT;

  protected readonly errorNombre = computed(() => fieldError(this.registroForm.nombre()));
  protected readonly errorApellidos = computed(() => fieldError(this.registroForm.apellidos()));
  protected readonly errorEmail = computed(
    () => this.serverErrorEmail() || fieldError(this.registroForm.email())
  );
  protected readonly errorContrasena = computed(() => fieldError(this.registroForm.contrasena()));
  protected readonly errorConfirmacion = computed(() =>
    fieldError(this.registroForm.confirmarContrasena())
  );
  protected readonly errorTerminos = computed(() => fieldError(this.registroForm.aceptaTerminos()));

  protected readonly submitting = computed(() => this.registroForm().submitting());

  constructor() {
    afterNextRender(() => {
      const config = this.config();
      if (!config) {
        void this.router.navigateByUrl('/registro').catch(() => {});
        return;
      }
      this.googleIdentity
        .renderizarBoton(
          this.googleButton().nativeElement,
          (idToken) => this.zone.run(() => this.registrarConGoogle(config.tipo, idToken)),
          'signup_with'
        )
        .catch(() => this.error.set('No se pudo cargar el registro con Google.'));
    });
  }

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async onSubmit(): Promise<void> {
    const config = this.config();
    if (!config) return;

    this.error.set('');
    this.serverErrorEmail.set('');

    await submit(this.registroForm, {
      action: async (field) => {
        const value = field().value();
        try {
          await firstValueFrom(config.enviarCorreo(this.authService, value));
          void this.router.navigateByUrl('/validacion-pendiente');
        } catch (err: unknown) {
          const status = (err as { status?: number })?.status;
          const message = (err as { error?: { message?: string } })?.error?.message;
          if (status === 409) {
            this.serverErrorEmail.set(
              message ?? 'Ya existe una cuenta con este correo electrónico.'
            );
          } else {
            this.error.set(message ?? 'No pudimos completar tu registro. Intenta nuevamente.');
          }
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }

  private registrarConGoogle(tipo: ConfigRol['tipo'], idToken: string): void {
    this.cargando.set(true);
    this.error.set('');
    this.authService.registrarConGoogle(tipo, idToken).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.redirigir(respuesta);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err?.error?.message ?? 'No pudimos completar tu registro. Intenta nuevamente.'
        );
      },
    });
  }

  private redirigir(respuesta: AuthResponse): void {
    this.router.navigateByUrl(respuesta.redirect || '/').catch(() => {
      this.error.set('No pudimos abrir tu panel. Intenta nuevamente.');
    });
  }
}
