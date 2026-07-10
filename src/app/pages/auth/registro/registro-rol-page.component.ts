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
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import { AuthResponse } from '../../../core/auth/auth.models';

type Rol = 'empresa' | 'auditor' | 'viajero';

interface ConfigRol {
  tipo: 'usuario' | 'empresa' | 'auditor';
  badge: string;
  titulo: string;
  subtitulo: string;
}

const CONFIG: Record<Rol, ConfigRol> = {
  empresa: {
    tipo: 'empresa',
    badge: 'EMPRESA · ADMINISTRADOR',
    titulo: 'Crea tu cuenta',
    subtitulo:
      'Regístrate con tu cuenta de Google. Después configurarás los datos de tu empresa: nombre, sector, cédula jurídica y más.',
  },
  auditor: {
    tipo: 'auditor',
    badge: 'AUDITOR CERTIFICADO',
    titulo: 'Crea tu cuenta',
    subtitulo:
      'Regístrate con tu cuenta de Google. Después cargarás tus credenciales profesionales para que el equipo de CarbonHub las valide.',
  },
  viajero: {
    tipo: 'usuario',
    badge: 'VIAJERO SOSTENIBLE',
    titulo: 'Crea tu cuenta',
    subtitulo:
      'Regístrate con tu cuenta de Google y empieza a planificar itinerarios de bajo impacto con EcoRuta.',
  },
};

@Component({
  selector: 'app-registro-rol-page',
  imports: [AuthLayoutComponent, RouterLink],
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
          (idToken) => this.zone.run(() => this.registrar(config.tipo, idToken)),
          'signup_with'
        )
        .catch(() => this.error.set('No se pudo cargar el registro con Google.'));
    });
  }

  private registrar(tipo: ConfigRol['tipo'], idToken: string): void {
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
