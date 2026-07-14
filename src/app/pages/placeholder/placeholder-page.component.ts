import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink],
  template: `
    <main class="placeholder">
      <div class="placeholder__card">
        <span class="placeholder__badge">Próximamente</span>
        <h1 class="placeholder__title">Estamos construyendo esta sección</h1>
        <p class="placeholder__text">
          Tu autenticación fue exitosa. Esta pantalla llega en un ticket aparte, muy pronto vas a
          poder continuar desde aquí.
        </p>
        <a class="placeholder__link" routerLink="/login">Volver al inicio de sesión</a>
      </div>
    </main>
  `,
  styles: `
    .placeholder {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--ch-space-6);
      background: var(--ch-green-soft);
    }

    .placeholder__card {
      max-width: 460px;
      width: 100%;
      text-align: center;
      padding: var(--ch-space-8);
      background: var(--ch-bg-white);
      border: 1px solid var(--ch-border);
      border-radius: var(--ch-radius-lg);
    }

    .placeholder__badge {
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

    .placeholder__title {
      margin: 0 0 var(--ch-space-3);
      font-family: var(--ch-font-heading);
      font-size: 24px;
      font-weight: 700;
      color: var(--ch-text-primary);
    }

    .placeholder__text {
      margin: 0 0 var(--ch-space-6);
      color: var(--ch-text-secondary);
      font-size: 15px;
      line-height: 1.5;
    }

    .placeholder__link {
      color: var(--ch-blue-mid);
      font-weight: 600;
      text-decoration: none;
    }

    .placeholder__link:hover {
      text-decoration: underline;
    }
  `,
})
export class PlaceholderPageComponent {}
