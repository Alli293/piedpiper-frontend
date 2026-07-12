import { Component, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout, finalize, TimeoutError } from 'rxjs';

import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

import { AuthService } from '../../core/services/auth.service';
import { AuthService as CoreAuthService } from '../../core/auth/auth.service';
import { GoogleIdentityService } from '../../core/auth/google-identity.service';
import { ToastService } from '../../shared/components/toast/toast.service';

import { nombreCompletoValidator } from '../../core/validators/text-validators';
import { emailValidator } from '../../core/validators/email-validator';
import { passwordValidator } from '../../core/validators/password-validator';
import { matchPasswordValidator } from '../../shared/validators/form-validators';

const SUBMIT_TIMEOUT_MS = 30000;

@Component({
  selector: 'app-registro-auditor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TextInputComponent,
    CheckboxComponent,
    ButtonComponent,
  ],
  templateUrl: './registro-auditor-page.component.html',
  styleUrl: './registro-auditor-page.component.scss',
})
export class RegistroAuditorPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private coreAuthService = inject(CoreAuthService);
  private googleIdentityService = inject(GoogleIdentityService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  isSubmitting = signal(false);

  googleButtonContainer = viewChild<ElementRef<HTMLDivElement>>('googleBtn');

  form = this.fb.group({
    nombre: ['', [Validators.required, nombreCompletoValidator]],
    apellidos: ['', [Validators.required, nombreCompletoValidator]],
    email: ['', [Validators.required, emailValidator]],
    contrasena: ['', [Validators.required, passwordValidator]],
    confirmarContrasena: ['', [Validators.required, matchPasswordValidator]],
    aceptaTerminos: [false, Validators.requiredTrue],
  });

  ngOnInit(): void {
    // Render Google button after view is ready
    setTimeout(() => this.initGoogleButton());
  }

  private initGoogleButton(): void {
    const container = this.googleButtonContainer();
    if (!container) return;

    this.googleIdentityService.renderizarBoton(
      container.nativeElement,
      (idToken) => this.handleGoogleCredential(idToken),
      'signup_with'
    );
  }

  private handleGoogleCredential(idToken: string): void {
    this.isSubmitting.set(true);
    this.coreAuthService.registrarConGoogle('auditor', idToken)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['/validacion-pendiente']);
        },
        error: (error) => this.handleSubmitError(error),
      });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.scrollToFirstError();
      return;
    }

    this.isSubmitting.set(true);

    const values = this.form.getRawValue();
    const body = {
      nombre: values.nombre,
      apellidos: values.apellidos,
      email: values.email,
      contrasena: values.contrasena,
      aceptaTerminos: values.aceptaTerminos,
    };

    this.authService
      .registrarAuditor(body)
      .pipe(
        timeout(SUBMIT_TIMEOUT_MS),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/validacion-pendiente']);
        },
        error: (error) => this.handleSubmitError(error),
      });
  }

  private handleSubmitError(error: unknown): void {
    if (error instanceof TimeoutError) {
      this.toastService.show('La operación excedió el tiempo de espera.', 'error');
      return;
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        this.form.controls.email.setErrors({ emailAlreadyExists: true });
        this.form.controls.email.markAsTouched();
        return;
      }

      if (error.status >= 500 || error.status === 0) {
        this.toastService.show('Error del servidor. Intenta más tarde.', 'error');
        return;
      }
    }

    this.toastService.show('Error del servidor. Intenta más tarde.', 'error');
  }

  private scrollToFirstError(): void {
    setTimeout(() => {
      const firstErrorEl = document.querySelector('.ng-invalid[formControlName]');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;

    switch (fieldName) {
      case 'nombre':
        if (errors['required']) return 'El nombre es obligatorio.';
        if (errors['minLength']) return 'El nombre debe tener al menos 2 caracteres.';
        if (errors['maxLength']) return 'El nombre no puede exceder 100 caracteres.';
        if (errors['pattern']) return 'Solo se permiten letras, espacios, acentos y guiones.';
        break;

      case 'apellidos':
        if (errors['required']) return 'Los apellidos son obligatorios.';
        if (errors['minLength']) return 'Los apellidos deben tener al menos 2 caracteres.';
        if (errors['maxLength']) return 'Los apellidos no pueden exceder 100 caracteres.';
        if (errors['pattern']) return 'Solo se permiten letras, espacios, acentos y guiones.';
        break;

      case 'email':
        if (errors['required']) return 'El correo electrónico es obligatorio.';
        if (errors['emailAlreadyExists']) return 'El correo ya está registrado.';
        if (errors['invalidEmail']) return 'El formato de correo es inválido.';
        break;

      case 'contrasena':
        if (errors['required']) return 'La contraseña es obligatoria.';
        if (errors['passwordMinLength']) return 'La contraseña debe tener al menos 8 caracteres.';
        if (errors['passwordMaxLength']) return 'La contraseña no puede exceder 64 caracteres.';
        if (errors['passwordComposition']) return 'La contraseña debe contener al menos 1 letra y 1 número.';
        break;

      case 'confirmarContrasena':
        if (errors['required']) return 'Debe confirmar la contraseña.';
        if (errors['passwordMismatch']) return 'Las contraseñas no coinciden.';
        break;
    }

    return '';
  }
}
