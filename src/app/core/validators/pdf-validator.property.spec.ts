import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import fc from 'fast-check';
import { isValidPdf, pdfValidator } from './pdf-validator';

/**
 * Property 6: PDF file metadata validation
 *
 * For any file metadata (MIME type, size), the PDF validator SHALL accept it
 * if and only if the MIME type equals "application/pdf" AND the size is
 * ≤ 10 MB (10,485,760 bytes).
 *
 * **Validates: Requirements 2.9**
 */
describe('PDF Validator - Property-Based Tests', () => {
  const MAX_PDF_SIZE = 10485760; // 10 MB

  describe('Property 6: PDF file metadata validation', () => {
    it('should accept any file with type "application/pdf" and size <= 10MB', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX_PDF_SIZE }),
          (size) => {
            expect(isValidPdf('application/pdf', size)).toBe(true);

            const file = new File([new Uint8Array(size)], 'test.pdf', { type: 'application/pdf' });
            const control = new FormControl(file);
            expect(pdfValidator(control)).toBeNull();
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject any file with type !== "application/pdf" regardless of size', () => {
      const nonPdfMimeTypes = fc.oneof(
        fc.constant('text/plain'),
        fc.constant('image/png'),
        fc.constant('image/jpeg'),
        fc.constant('application/json'),
        fc.constant('application/xml'),
        fc.constant('text/html'),
        fc.constant('application/octet-stream'),
        fc.constant('application/msword'),
        // Also generate arbitrary MIME types that are not application/pdf
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s !== 'application/pdf'),
      );

      fc.assert(
        fc.property(
          nonPdfMimeTypes,
          fc.integer({ min: 0, max: MAX_PDF_SIZE }),
          (mimeType, size) => {
            expect(isValidPdf(mimeType, size)).toBe(false);

            const file = new File([new Uint8Array(size)], 'test.file', { type: mimeType });
            const control = new FormControl(file);
            const result = pdfValidator(control);
            expect(result).not.toBeNull();
            expect(result).toEqual({ invalidFileType: true });
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject any file with size > 10MB even if type is "application/pdf"', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_PDF_SIZE + 1, max: MAX_PDF_SIZE + 10000 }),
          (size) => {
            expect(isValidPdf('application/pdf', size)).toBe(false);

            // Use a minimal File with overridden size for testing (avoid memory allocation)
            const file = { type: 'application/pdf', size, name: 'large.pdf' } as File;
            const control = new FormControl(file);
            const result = pdfValidator(control);
            expect(result).not.toBeNull();
            expect(result).toEqual({ fileTooLarge: true });
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject files with wrong MIME type AND size > 10MB', () => {
      const nonPdfMimeTypes = fc.oneof(
        fc.constant('text/plain'),
        fc.constant('image/png'),
        fc.constant('application/json'),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s !== 'application/pdf'),
      );

      fc.assert(
        fc.property(
          nonPdfMimeTypes,
          fc.integer({ min: MAX_PDF_SIZE + 1, max: MAX_PDF_SIZE + 10000 }),
          (mimeType, size) => {
            expect(isValidPdf(mimeType, size)).toBe(false);

            const file = { type: mimeType, size, name: 'test.file' } as File;
            const control = new FormControl(file);
            const result = pdfValidator(control);
            expect(result).not.toBeNull();
            // invalidFileType takes precedence (checked first)
            expect(result).toEqual({ invalidFileType: true });
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should satisfy the biconditional: accept iff type is "application/pdf" AND size <= 10MB', () => {
      const arbitraryMimeType = fc.oneof(
        fc.constant('application/pdf'),
        fc.constant('text/plain'),
        fc.constant('image/png'),
        fc.constant('application/json'),
        fc.string({ minLength: 1, maxLength: 50 }),
      );

      fc.assert(
        fc.property(
          arbitraryMimeType,
          fc.integer({ min: 0, max: MAX_PDF_SIZE + 50000 }),
          (mimeType, size) => {
            const shouldBeValid = mimeType === 'application/pdf' && size <= MAX_PDF_SIZE;
            expect(isValidPdf(mimeType, size)).toBe(shouldBeValid);
          },
        ),
        { numRuns: 500 },
      );
    });

    it('should return null for null/undefined value (required validator handles empty)', () => {
      const control = new FormControl(null);
      expect(pdfValidator(control)).toBeNull();
    });

    it('should accept exactly 10MB file (boundary)', () => {
      expect(isValidPdf('application/pdf', MAX_PDF_SIZE)).toBe(true);
    });

    it('should reject file at 10MB + 1 byte (boundary)', () => {
      expect(isValidPdf('application/pdf', MAX_PDF_SIZE + 1)).toBe(false);
    });
  });
});
