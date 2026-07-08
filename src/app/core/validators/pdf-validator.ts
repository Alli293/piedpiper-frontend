import { AbstractControl, ValidationErrors } from '@angular/forms';

const MAX_PDF_SIZE = 10485760; // 10 MB

/**
 * Pure function to validate PDF file metadata.
 * Accepts if and only if the MIME type equals "application/pdf"
 * AND the size is <= 10 MB (10,485,760 bytes).
 *
 * Validates: Requirements 2.9
 */
export function isValidPdf(mimeType: string, size: number): boolean {
  return mimeType === 'application/pdf' && size <= MAX_PDF_SIZE;
}

/**
 * Angular ValidatorFn for PDF file input.
 * Returns specific error keys for different failure modes.
 */
export function pdfValidator(control: AbstractControl): ValidationErrors | null {
  const file: File = control.value;
  if (!file) return null; // required validator handles empty

  if (file.type !== 'application/pdf') {
    return { invalidFileType: true };
  }

  if (file.size > MAX_PDF_SIZE) {
    return { fileTooLarge: true };
  }

  return null;
}
