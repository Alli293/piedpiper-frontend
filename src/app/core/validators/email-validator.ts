import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validates email format: must contain exactly one "@" character
 * followed by a domain with at least one dot (format: local@domain.tld).
 *
 * Validates: Requirements 2.2
 */
export function emailValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null; // required validator handles empty

  if (!isValidEmail(value)) {
    return { invalidEmail: true };
  }

  return null;
}

/**
 * Pure function to validate email format.
 * Accepts if and only if the string contains exactly one "@"
 * followed by a domain with at least one dot.
 */
export function isValidEmail(value: string): boolean {
  // Must contain exactly one "@"
  const atCount = (value.match(/@/g) || []).length;
  if (atCount !== 1) return false;

  const atIndex = value.indexOf('@');

  // Local part (before @) must not be empty
  const local = value.substring(0, atIndex);
  if (local.length === 0) return false;

  // Domain part (after @) must contain at least one dot
  const domain = value.substring(atIndex + 1);
  if (domain.length === 0) return false;

  const dotIndex = domain.indexOf('.');
  if (dotIndex === -1) return false;

  // Dot must not be first or last character in domain
  if (dotIndex === 0) return false;
  if (dotIndex === domain.length - 1) return false;

  // Parts after the last dot (TLD) must not be empty
  const parts = domain.split('.');
  for (const part of parts) {
    if (part.length === 0) return false;
  }

  return true;
}
