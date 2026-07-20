import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormField, form, pattern, required, schema, submit } from '@angular/forms/signals';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { HeadingComponent } from '../../../shared/components/heading/heading.component';
import { TextInputComponent } from '../../../shared/components/inputs/text-input/text-input.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LinkDirective } from '../../../shared/components/link/link.directive';
import { AuthService } from '../../../core/auth/auth.service';
import { EMAIL_MENSAJE, EMAIL_PATTERN } from '../../../shared/utils/email.utils';
import { fieldError } from '../../../shared/utils/form-field.utils';

interface RecuperarContrasenaFormModel {
  email: string;
}

@Component({
  selector: 'app-recuperar-contrasena-page',
  imports: [
    FormField,
    AuthLayoutComponent,
    RouterLink,
    LinkDirective,
    HeadingComponent,
    TextInputComponent,
    ButtonComponent,
  ],
  templateUrl: './recuperar-contrasena-page.component.html',
  styleUrl: './recuperar-contrasena-page.component.scss',
})
export class RecuperarContrasenaPageComponent {
  private readonly authService = inject(AuthService);

  protected readonly enviado = signal(false);
  protected readonly mensaje = signal('');
  protected readonly error = signal('');

  protected readonly model = signal<RecuperarContrasenaFormModel>({ email: '' });

  protected readonly recuperarForm = form(
    this.model,
    schema<RecuperarContrasenaFormModel>((path) => {
      required(path.email, { message: EMAIL_MENSAJE });
      pattern(path.email, EMAIL_PATTERN, { message: EMAIL_MENSAJE });
    })
  );

  protected readonly errorEmail = computed(() => fieldError(this.recuperarForm.email()));
  protected readonly submitting = computed(() => this.recuperarForm().submitting());

  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.onSubmit();
  }

  private async onSubmit(): Promise<void> {
    this.error.set('');

    await submit(this.recuperarForm, {
      action: async (field) => {
        const value = field().value();
        try {
          const respuesta = await firstValueFrom(
            this.authService.solicitarResetContrasena(value.email.trim())
          );
          this.mensaje.set(respuesta.mensaje);
          this.enviado.set(true);
        } catch (err: unknown) {
          const message = (err as { error?: { message?: string } })?.error?.message;
          this.error.set(message ?? 'No pudimos procesar tu solicitud. Intenta nuevamente.');
        }
        return undefined;
      },
      onInvalid: (field) => field().markAsTouched(),
    });
  }
}
