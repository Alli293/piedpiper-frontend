import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TextInputComponent } from '../../shared/components/inputs/text-input/text-input.component';
import {
  SelectInputComponent,
  SelectOption,
} from '../../shared/components/inputs/select-input/select-input.component';
import { CheckboxComponent } from '../../shared/components/inputs/checkbox/checkbox.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FileInputComponent } from '../../shared/components/inputs/file-input/file-input.component';

import { CatalogService } from '../../core/services/catalog.service';
import { EntidadCertificadora } from '../../core/models/entidad-certificadora.model';

import { nombreCompletoValidator, numeroCertificacionValidator, entidadCertificadoraOtraValidator } from '../../core/validators/text-validators';
import { emailValidator } from '../../core/validators/email-validator';
import { passwordValidator } from '../../core/validators/password-validator';
import { numericRangeValidator } from '../../core/validators/numeric-range-validator';
import { pdfValidator } from '../../core/validators/pdf-validator';
import { matchPasswordValidator, futureDateValidator } from '../../shared/validators/form-validators';

const OTRA_VALUE = 'otra';

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
  private catalogService = inject(CatalogService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  entidades = signal<EntidadCertificadora[]>([]);
  showOtraEntidad = signal(false);

  form = this.fb.group({
    nombreCompleto: ['', [Validators.required, nombreCompletoValidator]],
    email: ['', [Validators.required, emailValidator]],
    contrasena: ['', [Validators.required, passwordValidator]],
    confirmarContrasena: ['', [Validators.required, matchPasswordValidator]],
    numeroCertificacion: ['', [Validators.required, numeroCertificacionValidator]],
    entidadCertificadora: ['', Validators.required],
    entidadCertificadoraOtra: [''],
    fechaVigenciaCert: ['', [Validators.required, futureDateValidator]],
    aniosExperiencia: [null as number | null, [Validators.required, numericRangeValidator]],
    docCertificadoPdf: [null as File | null, [Validators.required, pdfValidator]],
    docIdentificacionPdf: [null as File | null, [Validators.required, pdfValidator]],
    aceptaTerminos: [false, Validators.requiredTrue],
  });

  entidadesOptions = computed<SelectOption[]>(() => {
    const options: SelectOption[] = this.entidades().map((e) => ({
      value: String(e.id),
      label: e.nombre,
    }));
    options.push({ value: OTRA_VALUE, label: 'Otra' });
    return options;
  });

  isSubmitDisabled = computed(() => !this.form.controls.aceptaTerminos.value);

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

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;

    switch (fieldName) {
      case 'nombreCompleto':
        if (errors['required']) return 'El nombre completo es obligatorio.';
        if (errors['minLength']) return 'El nombre debe tener al menos 2 caracteres.';
        if (errors['maxLength']) return 'El nombre no puede exceder 100 caracteres.';
        if (errors['pattern']) return 'Solo se permiten letras, espacios, acentos y guiones.';
        break;

      case 'email':
        if (errors['required']) return 'El correo electrónico es obligatorio.';
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
