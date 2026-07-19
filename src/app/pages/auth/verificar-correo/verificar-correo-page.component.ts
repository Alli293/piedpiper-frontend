import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StateLayoutComponent } from '../../../shared/layouts/state-layout/state-layout.component';
import { CardComponent } from '../../../shared/components/card/card.component';
import { SemanticCardComponent } from '../../../shared/components/semantic-card/semantic-card.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-verificar-correo-page',
  imports: [
    RouterLink,
    StateLayoutComponent,
    CardComponent,
    SemanticCardComponent,
    TextInputComponent,
    ButtonComponent,
  ],
  templateUrl: './verificar-correo-page.component.html',
  styleUrl: './verificar-correo-page.component.scss',
})
export class VerificarCorreoPageComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly token = input('');

  protected readonly cargando = signal(true);
  protected readonly mensajeExito = signal('');
  protected readonly mensajeInvalido = signal('');

  protected readonly reenviarEmail = signal('');
  protected readonly reenviarEnviando = signal(false);
  protected readonly reenviarMensaje = signal('');
  protected readonly reenviarError = signal('');

  ngOnInit(): void {
    if (!this.token()) {
      this.cargando.set(false);
      this.mensajeInvalido.set('Este enlace de verificación no es válido.');
      return;
    }

    this.authService.verificarCorreo(this.token()).subscribe({
      next: (respuesta) => {
        this.cargando.set(false);
        this.mensajeExito.set(respuesta.mensaje);
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje = err?.error?.message ?? 'Este enlace de verificación no es válido o expiró.';
        if (err?.status === 409) {
          this.mensajeExito.set(mensaje);
        } else {
          this.mensajeInvalido.set(mensaje);
        }
      },
    });
  }

  protected reenviar(event: Event): void {
    event.preventDefault();
    if (this.reenviarEnviando()) {
      return;
    }
    this.reenviarEnviando.set(true);
    this.reenviarMensaje.set('');
    this.reenviarError.set('');

    this.authService.reenviarVerificacion(this.reenviarEmail().trim()).subscribe({
      next: (respuesta) => {
        this.reenviarEnviando.set(false);
        this.reenviarMensaje.set(respuesta.mensaje);
      },
      error: (err) => {
        this.reenviarEnviando.set(false);
        this.reenviarError.set(
          err?.error?.message ?? 'No pudimos reenviar el enlace. Intenta nuevamente.'
        );
      },
    });
  }
}
