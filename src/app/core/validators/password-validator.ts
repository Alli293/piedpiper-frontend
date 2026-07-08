import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Pure function to validate password composition.
 * Accepts if and only if the string has length between 8 and 64 characters inclusive
 * AND contains at least one letter (a-zA-Z) AND at least one digit (0-9).
 *
 * Validates: Requirements 2.3
 */
export function isValidPassword(value: string): boolean {
  if (value.length < 8 || value.length > 64) return false;

  const hasLetter = /[a-zA-Z]/.test(value);
  const hasDigit = /\d/.test(value);

  return hasLetter && hasDigit;
}

/**
 * Angular ValidatorFn for password field.
 * Returns specific error keys for different failure modes.
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
