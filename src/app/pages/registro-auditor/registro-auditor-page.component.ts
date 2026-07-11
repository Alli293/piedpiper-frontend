import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout, finalize, TimeoutError } from 'rxjs';

import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FileInputComponent } from '../../shared/components/inputs/file-input/file-input.component';

import { AuthService } from '../../core/services/auth.service';
import { CatalogService } from '../../core/services/catalog.service';
import { EntidadCertificadora } from '../../core/models/entidad-certificadora.model';
import { ToastService } from '../../shared/components/toast/toast.service';

import { nombreCompletoValidator, numeroCertificacionValidator, entidadCertificadoraOtraValidator } from '../../core/validators/text-validators';
import { emailValidator } from '../../core/validators/email-validator';
import { passwordValidator } from '../../core/validators/password-validator';
import { numericRangeValidator } from '../../core/validators/numeric-range-validator';
import { pdfValidator } from '../../core/validators/pdf-validator';
import { matchPasswordValidator, futureDateValidator } from '../../shared/validators/form-validators';

const OTRA_VALUE = 'otra';
const SUBMIT_TIMEOUT_MS = 30000;
const TOTAL_STEPS = 3;

@Component({
  selector: 'app-registro-auditor-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TextInputComponent,
    SelectInputComponent,
    CheckboxComponent,
    ButtonComponent,
    FileInputComponent,
  ],
  templateUrl: './registro-auditor-page.component.html',
  styleUrl: './registro-auditor-page.component.scss',
})
export class RegistroAuditorPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private catalogService = inject(CatalogService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  entidades = signal<EntidadCertificadora[]>([]);
  isSubmitting = signal(false);
  showOtraEntidad = signal(false);
  currentStep = signal(1);

  readonly totalSteps = TOTAL_STEPS;

  form = this.fb.group({
    // Step 1: Account
    nombre: ['', [Validators.required, nombreCompletoValidator]],
    apellidos: ['', [Validators.required, nombreCompletoValidator]],
    email: ['', [Validators.required, emailValidator]],
    contrasena: ['', [Validators.required, passwordValidator]],
    confirmarContrasena: ['', [Validators.required, matchPasswordValidator]],
    aceptaTerminos: [false, Validators.requiredTrue],
    // Step 2: Credentials
    numeroCertificacion: ['', [Validators.required, numeroCertificacionValidator]],
    entidadCertificadora: ['', Validators.required],
    entidadCertificadoraOtra: [''],
    fechaVigenciaCert: ['', [Validators.required, futureDateValidator]],
    aniosExperiencia: [null as number | null, [Validators.required, numericRangeValidator]],
    // Step 3: Documents
    docCertificadoPdf: [null as File | null, [Validators.required, pdfValidator]],
    docIdentificacionPdf: [null as File | null, [Validators.required, pdfValidator]],
  });

  entidadesOptions = computed<SelectOption[]>(() => {
    const options: SelectOption[] = this.entidades().map((e) => ({
      value: String(e.id),
      label: e.nombre,
    }));
    options.push({ value: OTRA_VALUE, label: 'Otra' });
    return options;
  });

  /** Fields that belong to each step for validation purposes */
  private stepFields: Record<number, string[]> = {
    1: ['nombre', 'apellidos', 'email', 'contrasena', 'confirmarContrasena', 'aceptaTerminos'],
    2: ['numeroCertificacion', 'entidadCertificadora', 'entidadCertificadoraOtra', 'fechaVigenciaCert', 'aniosExperiencia'],
    3: ['docCertificadoPdf', 'docIdentificacionPdf'],
  };

  ngOnInit(): void {
    this.catalogService.getEntidadesCertificadoras().subscribe({
      next: (entidades) => this.entidades.set(entidades),
    });

    this.form.controls.entidadCertificadora.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.onEntidadCertificadoraChange(value ?? ''));
  }

  onEntidadCertificadoraChange(value: string): void {
    const isOtra = value === OTRA_VALUE;
    this.showOtraEntidad.set(isOtra);

    const otraControl = this.form.controls.entidadCertificadoraOtra;

    if (isOtra) {
      otraControl.setValidators([Validators.required, entidadCertificadoraOtraValidator]);
    } else {
      otraControl.clearValidators();
      otraControl.setValue('');
    }
    otraControl.updateValueAndValidity();
  }

  /** Navigate to next step if current step fields are valid */
  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.currentStep.update((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  }

  /** Navigate to previous step */
  prevStep(): void {
    this.currentStep.update((s) => Math.max(s - 1, 1));
  }

  /** Navigate directly to a step (only if all previous steps are valid) */
  goToStep(step: number): void {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
      return;
    }
    // Can only go forward if all intermediate steps are valid
    for (let i = this.currentStep(); i < step; i++) {
      if (!this.isStepValid(i)) return;
    }
    this.currentStep.set(step);
  }

  /** Check if a specific step's fields are all valid */
  isStepValid(step: number): boolean {
    const fields = this.stepFields[step] ?? [];
    return fields.every((field) => {
      const control = this.form.get(field);
      if (!control) return true;
      // Skip entidadCertificadoraOtra if not showing
      if (field === 'entidadCertificadoraOtra' && !this.showOtraEntidad()) return true;
      return control.valid;
    });
  }

  /** Check if a step has been completed (for stepper indicators) */
  isStepCompleted(step: number): boolean {
    return step < this.currentStep() && this.isStepValid(step);
  }

  onSubmit(): void {
    // Final validation of all fields
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      // Find which step has the first error and go there
      for (let step = 1; step <= TOTAL_STEPS; step++) {
        if (!this.isStepValid(step)) {
          this.currentStep.set(step);
          this.scrollToFirstError();
          return;
        }
      }
      return;
    }

    this.isSubmitting.set(true);

    const formData = this.buildFormData();

    this.authService
      .registrarAuditor(formData)
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

  private validateCurrentStep(): boolean {
    const fields = this.stepFields[this.currentStep()] ?? [];
    let valid = true;

    for (const field of fields) {
      const control = this.form.get(field);
      if (!control) continue;
      // Skip entidadCertificadoraOtra validation if not showing
      if (field === 'entidadCertificadoraOtra' && !this.showOtraEntidad()) continue;
      control.markAsTouched();
      control.updateValueAndValidity();
      if (control.invalid) valid = false;
    }

    if (!valid) {
      this.scrollToFirstError();
    }

    return valid;
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const values = this.form.getRawValue();

    const entidadId = values.entidadCertificadora === OTRA_VALUE
      ? null
      : Number(values.entidadCertificadora);

    const entidadOtra = values.entidadCertificadora === OTRA_VALUE
      ? values.entidadCertificadoraOtra
      : null;

    const datos = {
      nombre: values.nombre,
      apellidos: values.apellidos,
      email: values.email,
      contrasena: values.contrasena,
      numeroCertificacion: values.numeroCertificacion,
      entidadCertificadoraId: entidadId,
      entidadCertificadoraOtra: entidadOtra,
      fechaVigenciaCert: values.fechaVigenciaCert,
      aniosExperiencia: values.aniosExperiencia,
      aceptaTerminos: values.aceptaTerminos,
    };

    const datosBlob = new Blob([JSON.stringify(datos)], { type: 'application/json' });
    formData.append('datos', datosBlob);

    if (values.docCertificadoPdf) {
      formData.append('doc_certificado', values.docCertificadoPdf);
    }

    if (values.docIdentificacionPdf) {
      formData.append('doc_identificacion', values.docIdentificacionPdf);
    }

    return formData;
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
        // Go back to step 1 where the email field is
        this.currentStep.set(1);
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

      case 'numeroCertificacion':
        if (errors['required']) return 'El número de certificación es obligatorio.';
        if (errors['minLength']) return 'Debe tener al menos 1 carácter.';
        if (errors['maxLength']) return 'No puede exceder 50 caracteres.';
        if (errors['pattern']) return 'Solo se permiten caracteres alfanuméricos y guiones.';
        break;

      case 'entidadCertificadora':
        if (errors['required']) return 'Debe seleccionar una entidad certificadora.';
        break;

      case 'entidadCertificadoraOtra':
        if (errors['required']) return 'El nombre de la entidad es obligatorio.';
        if (errors['minLength']) return 'Debe tener al menos 2 caracteres.';
        if (errors['maxLength']) return 'No puede exceder 100 caracteres.';
        if (errors['pattern']) return 'Solo se permiten letras, espacios, acentos, puntos y guiones.';
        break;

      case 'fechaVigenciaCert':
        if (errors['required']) return 'La fecha de vigencia es obligatoria.';
        if (errors['futureDate']) return 'La fecha debe ser presente o futura.';
        break;

      case 'aniosExperiencia':
        if (errors['required']) return 'Los años de experiencia son obligatorios.';
        if (errors['notInteger']) return 'Debe ser un número entero.';
        if (errors['min']) return 'El valor mínimo es 0.';
        if (errors['max']) return 'El valor máximo es 60.';
        break;

      case 'docCertificadoPdf':
        if (errors['required']) return 'El certificado PDF es obligatorio.';
        if (errors['invalidFileType']) return 'Solo se permiten archivos PDF.';
        if (errors['fileTooLarge']) return 'El archivo excede el tamaño máximo de 10 MB.';
        break;

      case 'docIdentificacionPdf':
        if (errors['required']) return 'La identificación PDF es obligatoria.';
        if (errors['invalidFileType']) return 'Solo se permiten archivos PDF.';
        if (errors['fileTooLarge']) return 'El archivo excede el tamaño máximo de 10 MB.';
        break;
    }

    return '';
  }
}
