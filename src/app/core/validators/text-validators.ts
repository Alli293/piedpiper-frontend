import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const NOMBRE_COMPLETO_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-]+$/;
const NUMERO_CERTIFICACION_PATTERN = /^[a-zA-Z0-9\-]+$/;
const ENTIDAD_CERTIFICADORA_OTRA_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.\-]+$/;

/**
 * Validates nombre_completo: 2-100 chars, only letters (including accented), spaces, and hyphens.
 */
export function nombreCompletoValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  if (value.length < 2) return { minLength: { requiredLength: 2, actualLength: value.length } };
  if (value.length > 100) return { maxLength: { requiredLength: 100, actualLength: value.length } };
  if (!NOMBRE_COMPLETO_PATTERN.test(value)) return { pattern: true };

  return null;
}

/**
 * Validates numero_certificacion: 1-50 chars, alphanumeric and hyphens only.
 */
export function numeroCertificacionValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  if (value.length < 1) return { minLength: { requiredLength: 1, actualLength: value.length } };
  if (value.length > 50) return { maxLength: { requiredLength: 50, actualLength: value.length } };
  if (!NUMERO_CERTIFICACION_PATTERN.test(value)) return { pattern: true };

  return null;
}

/**
 * Validates entidad_certificadora_otra: 2-100 chars, letters (including accented), spaces, dots, and hyphens.
 */
export function entidadCertificadoraOtraValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  if (value.length < 2) return { minLength: { requiredLength: 2, actualLength: value.length } };
  if (value.length > 100) return { maxLength: { requiredLength: 100, actualLength: value.length } };
  if (!ENTIDAD_CERTIFICADORA_OTRA_PATTERN.test(value)) return { pattern: true };

  return null;
}

// Export patterns for testing purposes
export const TEXT_VALIDATOR_PATTERNS = {
  nombreCompleto: NOMBRE_COMPLETO_PATTERN,
  numeroCertificacion: NUMERO_CERTIFICACION_PATTERN,
  entidadCertificadoraOtra: ENTIDAD_CERTIFICADORA_OTRA_PATTERN,
} as const;
