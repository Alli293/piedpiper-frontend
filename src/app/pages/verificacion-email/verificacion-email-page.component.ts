import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

type VerificacionEstado = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verificacion-email-page',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './verificacion-email-page.component.html',
  styleUrl: './verificacion-email-page.component.scss',
})
export class VerificacionEmailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  estado = signal<VerificacionEstado>('loading');
  mensaje = signal('');
  puedeReenviar = signal(false);
  emailReenvio = signal('');
  reenviando = signal(false);
  reenvioExitoso = signal(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.estado.set('error');
      this.mensaje.set('No se proporcionó un token de verificación.');
      return;
    }

    this.authService.verificarEmail(token).subscribe({
      next: (response) => {
        this.estado.set('success');
        this.mensaje.set(response.mensaje || 'Email verificado. Tu solicitud está en revisión por un administrador.');
      },
      error: (error) => {
        this.estado.set('error');
        const body = error?.error;
        this.mensaje.set(body?.mensaje || 'El enlace de verificación es inválido o ha expirado.');
        this.puedeReenviar.set(body?.puedeReenviar ?? true);
        this.emailReenvio.set(body?.email || '');
      },
    });
  }

  reenviarVerificacion(): void {
    const email = this.emailReenvio();
    if (!email) return;

    this.reenviando.set(true);
    this.authService.reenviarVerificacion(email).subscribe({
      next: () => {
        this.reenviando.set(false);
        this.reenvioExitoso.set(true);
      },
      error: () => {
        this.reenviando.set(false);
      },
    });
  }
}
