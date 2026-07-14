import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { CheckboxComponent } from '../../../shared/components/inputs/checkbox/checkbox.component';
import { AuthService } from '../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import {
  InvitacionPublica,
  InvitacionesService,
} from '../../../core/invitaciones/invitaciones.service';

@Component({
  selector: 'app-registro-invitacion-page',
  imports: [AuthLayoutComponent, CheckboxComponent, RouterLink],
  templateUrl: './registro-invitacion-page.component.html',
  styleUrl: './registro-invitacion-page.component.scss',
})
export class RegistroInvitacionPageComponent implements OnInit {
  private readonly invitacionesService = inject(InvitacionesService);
  private readonly authService = inject(AuthService);
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  readonly token = input('');

  private readonly googleButton = viewChild<ElementRef<HTMLElement>>('googleButton');
  private botonRenderizado = false;

  protected readonly cargando = signal(true);
  protected readonly invitacion = signal<InvitacionPublica | null>(null);
  protected readonly mensajePantalla = signal('');
  protected readonly aceptaTerminos = signal(false);
  protected readonly registrando = signal(false);
  protected readonly error = signal('');
  protected readonly cuentaExistente = signal(false);

  constructor() {
    effect(() => {
      const contenedor = this.googleButton();
      if (contenedor && !this.botonRenderizado) {
        this.botonRenderizado = true;
        this.googleIdentity
          .renderizarBoton(
            contenedor.nativeElement,
            (idToken) => this.zone.run(() => this.registrar(idToken)),
            'signup_with'
          )
          .catch(() => this.error.set('No se pudo cargar el registro con Google.'));
      }
    });
  }

  ngOnInit(): void {
    this.validarToken();
  }

  protected registrar(idToken: string): void {
    if (!this.aceptaTerminos() || this.registrando()) {
      return;
    }
    this.error.set('');
    this.cuentaExistente.set(false);
    this.registrando.set(true);
    this.authService.registrarConInvitacion(this.token(), idToken).subscribe({
      next: (respuesta) => {
        this.registrando.set(false);
        this.router.navigateByUrl(respuesta.redirect || '/').catch(() => {
          this.error.set('No pudimos abrir tu panel. Intenta nuevamente.');
        });
      },
      error: (err) => {
        this.registrando.set(false);
        if (err?.status === 409) {
          this.cuentaExistente.set(true);
        }
        this.error.set(
          err?.error?.message ??
            'Ocurrió un error al registrar tu cuenta. Por favor, intenta nuevamente.'
        );
      },
    });
  }

  private validarToken(): void {
    if (!this.token()) {
      this.cargando.set(false);
      this.mensajePantalla.set('Este enlace de invitación no es válido.');
      return;
    }
    this.invitacionesService.resolver(this.token()).subscribe({
      next: (invitacion) => {
        this.cargando.set(false);
        this.invitacion.set(invitacion);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mensajePantalla.set(this.mensajePorEstado(err?.status));
      },
    });
  }

  private mensajePorEstado(status?: number): string {
    if (status === 410) {
      return 'Esta invitación ha expirado. Solicita una nueva al administrador de tu empresa.';
    }
    if (status === 409) {
      return 'Esta invitación ya no está disponible. Solicita una nueva al administrador de tu empresa.';
    }
    return 'Este enlace de invitación no es válido.';
  }
}
