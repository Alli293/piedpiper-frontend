import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Pure function to validate numeric range for años-experiencia.
 * Accepts if and only if the value is an integer in the range [0, 60].
 *
 * Validates: Requirements 2.8
 */
export function isValidExperienceYears(value: number): boolean {
  if (value === null || value === undefined) return false;
  if (!Number.isInteger(value)) return false;
  return value >= 0 && value <= 60;
}

/**
 * Angular ValidatorFn for años-experiencia field.
 * Returns specific error keys for different failure modes:
 * - notInteger: value is not an integer
 * - min: value is below 0
 * - max: value is above 60
 */
export function numericRangeValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null; // required handles empty

  const numValue = typeof value === 'string' ? Number(value) : value;

  if (isNaN(numValue)) return { notInteger: true };
  if (!Number.isInteger(numValue)) return { notInteger: true };
  if (numValue < 0) return { min: { min: 0, actual: numValue } };
  if (numValue > 60) return { max: { max: 60, actual: numValue } };

  return null;
}
