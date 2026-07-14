import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../shared/layouts/auth-layout/auth-layout.component';

@Component({
  selector: 'app-validacion-pendiente-page',
  imports: [RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout>
      <div class="validacion">
        <span class="validacion__badge">Verificación pendiente</span>
        <h1 class="validacion__title">Tu cuenta está pendiente de verificación</h1>
        <p class="validacion__text">
          Te enviamos un correo electrónico para verificar tu cuenta. Revisa tu bandeja de entrada y
          haz clic en el enlace de confirmación.
        </p>
        <a class="validacion__link" routerLink="/login">Ir al inicio de sesión</a>
      </div>
    </app-auth-layout>
  `,
  styles: `
    .validacion {
      text-align: center;
    }

    .validacion__badge {
      display: inline-block;
      margin-bottom: var(--ch-space-4);
      padding: 4px 12px;
      border-radius: var(--ch-radius-full);
      background: var(--ch-green-soft);
      color: var(--ch-green-dark);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .validacion__title {
      margin: 0 0 var(--ch-space-3);
      font-family: var(--ch-font-heading);
      font-size: 24px;
      font-weight: 700;
      color: var(--ch-text-primary);
    }

    .validacion__text {
      margin: 0 0 var(--ch-space-6);
      color: var(--ch-text-secondary);
      font-size: 15px;
      line-height: 1.5;
    }

    .validacion__link {
      color: var(--ch-blue-mid);
      font-weight: 600;
      text-decoration: none;
    }

    .validacion__link:hover {
      text-decoration: underline;
    }
  `,
})
export class ValidacionPendientePageComponent {}
