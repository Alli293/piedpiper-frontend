import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates password: 8-64 chars, at least 1 letter and 1 digit.
 */
export function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null; // required validator handles empty

  if (value.length < 8) return { passwordMinLength: true };
  if (value.length > 64) return { passwordMaxLength: true };

  const hasLetter = /[a-zA-Z]/.test(value);
  const hasDigit = /\d/.test(value);

  if (!hasLetter || !hasDigit) {
    return { passwordComposition: true };
  }

  return null;
}

/**
 * Validates that confirmarContrasena matches contrasena.
 * Use as a cross-field validator on the 'confirmarContrasena' control.
 * Requires the form group to have a 'contrasena' control.
 */
export function matchPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;

  const password = parent.get('contrasena')?.value;
  const confirm = control.value;

  if (!confirm) return null; // required handles empty

  if (password !== confirm) {
    return { passwordMismatch: true };
  }

  return null;
}

/**
 * Validates that a date is today or in the future (UTC comparison).
 */
export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null; // required handles empty

  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate < today) {
    return { futureDate: true };
  }

  return null;
}

/**
 * Validates file: must be application/pdf and <= 10MB (10,485,760 bytes).
 * Works with File objects (from file input).
 */
export function pdfValidator(control: AbstractControl): ValidationErrors | null {
  const file: File = control.value;
  if (!file) return null; // required handles empty

  if (file.type !== 'application/pdf') {
    return { invalidFileType: true };
  }

  if (file.size > 10485760) {
    // 10 MB
    return { fileTooLarge: true };
  }

  return null;
}

/**
 * Creates a validator for text fields with pattern and length constraints.
 * @param pattern - RegExp to validate against
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 */
export function textFieldValidator(pattern: RegExp, minLength: number, maxLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (value.length < minLength)
      return { minLength: { requiredLength: minLength, actualLength: value.length } };
    if (value.length > maxLength)
      return { maxLength: { requiredLength: maxLength, actualLength: value.length } };
    if (!pattern.test(value)) return { pattern: true };

    return null;
  };
}
