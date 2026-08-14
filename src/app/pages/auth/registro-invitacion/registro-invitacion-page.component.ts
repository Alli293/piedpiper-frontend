import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnInit,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SemanticCardComponent } from '../../../shared/components/semantic-card/semantic-card.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { LinkDirective } from '../../../shared/components/link/link.directive';
import { apiErrorMessage } from '../../../shared/utils/http-error.utils';
import { AuthService } from '../../../core/auth/auth.service';
import { EnlaceUnSoloUsoService } from '../../../core/auth/enlace-un-solo-uso.service';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';
import {
  InvitacionPublica,
  InvitacionesService,
} from '../../../core/invitaciones/invitaciones.service';
import { RegistroInvitacionCorreoFormComponent } from './registro-invitacion-correo-form.component';

@Component({
  selector: 'app-registro-invitacion-page',
  imports: [
    AuthLayoutComponent,
    BadgeComponent,
    HeadingComponent,
    RouterLink,
    LinkDirective,
    SemanticCardComponent,
    RegistroInvitacionCorreoFormComponent,
  ],
  templateUrl: './registro-invitacion-page.component.html',
  styleUrl: './registro-invitacion-page.component.scss',
})
export class RegistroInvitacionPageComponent implements OnInit {
  private readonly invitacionesService = inject(InvitacionesService);
  private readonly authService = inject(AuthService);
  private readonly enlaceUnSoloUso = inject(EnlaceUnSoloUsoService);
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly token = input('');
  protected readonly tokenLimpio = signal('');

  private readonly googleButton = viewChild<ElementRef<HTMLElement>>('googleButton');
  private botonRenderizado = false;

  protected readonly cargando = signal(true);
  protected readonly invitacion = signal<InvitacionPublica | null>(null);
  protected readonly mensajePantalla = signal('');
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
    this.tokenLimpio.set(this.enlaceUnSoloUso.consumir(this.token()));
    this.validarToken();
  }

  protected registrar(idToken: string): void {
    if (this.registrando()) {
      return;
    }
    this.error.set('');
    this.cuentaExistente.set(false);
    this.registrando.set(true);
    this.authService
      .registrarConInvitacion(this.tokenLimpio(), idToken, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.registrando.set(false);
          this.router.navigateByUrl(respuesta.redirect || '/').catch(() => {
            this.error.set('No pudimos abrir tu panel. Intenta nuevamente.');
          });
        },
        error: (err: HttpErrorResponse) => {
          this.registrando.set(false);
          if (err.status === 409) {
            this.cuentaExistente.set(true);
          }
          this.error.set(
            apiErrorMessage(err) ??
              'Ocurrió un error al registrar tu cuenta. Por favor, intenta nuevamente.'
          );
        },
      });
  }

  private validarToken(): void {
    if (!this.tokenLimpio()) {
      this.cargando.set(false);
      this.mensajePantalla.set('Este enlace de invitación no es válido.');
      return;
    }
    this.invitacionesService
      .resolver(this.tokenLimpio())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (invitacion) => {
          this.cargando.set(false);
          this.invitacion.set(invitacion);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.mensajePantalla.set(this.mensajePorEstado(err.status));
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
