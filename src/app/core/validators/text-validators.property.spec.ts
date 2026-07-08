/**
 * Property-based tests for text field validators.
 *
 * **Validates: Requirements 2.1, 2.5, 3.3**
 *
 * Property 1: Text field regex validation
 * For any string input to a text-based validator (nombre_completo, numero_certificacion,
 * entidad_certificadora_otra), the validator SHALL accept the string if and only if it
 * matches the defined regex pattern AND satisfies the length constraints.
 */
import * as fc from 'fast-check';
import { FormControl } from '@angular/forms';
import {
  nombreCompletoValidator,
  numeroCertificacionValidator,
  entidadCertificadoraOtraValidator,
  TEXT_VALIDATOR_PATTERNS,
} from './text-validators';

// --- Arbitrary generators ---

/** Generates a single character from the valid charset for nombre_completo */
const nombreCharArb = fc.mapToConstant(
  { num: 26, build: (v: number) => String.fromCharCode(65 + v) }, // A-Z
  { num: 26, build: (v: number) => String.fromCharCode(97 + v) }, // a-z
  { num: 1, build: () => ' ' },
  { num: 1, build: () => '-' },
  { num: 5, build: (v: number) => 'áéíóú'[v] },
  { num: 5, build: (v: number) => 'ÁÉÍÓÚ'[v] },
  { num: 2, build: (v: number) => 'ñÑ'[v] },
  { num: 2, build: (v: number) => 'üÜ'[v] },
);

/** Generates strings from the valid charset for nombre_completo */
function validNombreString(minLen: number, maxLen: number): fc.Arbitrary<string> {
  return fc.array(nombreCharArb, { minLength: minLen, maxLength: maxLen }).map((arr) => arr.join(''));
}

/** Generates a single character from the valid charset for numero_certificacion */
const certCharArb = fc.mapToConstant(
  { num: 26, build: (v: number) => String.fromCharCode(65 + v) }, // A-Z
  { num: 26, build: (v: number) => String.fromCharCode(97 + v) }, // a-z
  { num: 10, build: (v: number) => String.fromCharCode(48 + v) }, // 0-9
  { num: 1, build: () => '-' },
);

/** Generates strings from the valid charset for numero_certificacion */
function validCertString(minLen: number, maxLen: number): fc.Arbitrary<string> {
  return fc.array(certCharArb, { minLength: minLen, maxLength: maxLen }).map((arr) => arr.join(''));
}

/** Generates a single character from the valid charset for entidad_certificadora_otra */
const entidadCharArb = fc.mapToConstant(
  { num: 26, build: (v: number) => String.fromCharCode(65 + v) }, // A-Z
  { num: 26, build: (v: number) => String.fromCharCode(97 + v) }, // a-z
  { num: 1, build: () => ' ' },
  { num: 1, build: () => '.' },
  { num: 1, build: () => '-' },
  { num: 5, build: (v: number) => 'áéíóú'[v] },
  { num: 5, build: (v: number) => 'ÁÉÍÓÚ'[v] },
  { num: 2, build: (v: number) => 'ñÑ'[v] },
  { num: 2, build: (v: number) => 'üÜ'[v] },
);

/** Generates strings from the valid charset for entidad_certificadora_otra */
function validEntidadString(minLen: number, maxLen: number): fc.Arbitrary<string> {
  return fc.array(entidadCharArb, { minLength: minLen, maxLength: maxLen }).map((arr) => arr.join(''));
}

/** Generates strings with at least one invalid character (not matching any text pattern) */
const invalidCharArbitrary: fc.Arbitrary<string> = fc
  .tuple(
    fc.string({ minLength: 0, maxLength: 5 }),
    fc.constantFrom(
      '@', '#', '$', '%', '&', '!', '?', '/', '\\', '=', '+', '*', '<', '>', '~', '`', '{', '}', '[', ']', '|', '^',
    ),
    fc.string({ minLength: 0, maxLength: 5 }),
  )
  .map(([prefix, invalidChar, suffix]) => prefix + invalidChar + suffix)
  .filter((s) => s.length >= 2);

describe('Property 1: Text field regex validation', () => {
  describe('nombreCompletoValidator', () => {
    const PATTERN = TEXT_VALIDATOR_PATTERNS.nombreCompleto;
    const MIN = 2;
    const MAX = 100;

    it('accepts any string within valid charset and length [2, 100]', () => {
      fc.assert(
        fc.property(validNombreString(MIN, MAX), (input: string) => {
          const control = new FormControl(input);
          const result = nombreCompletoValidator(control);
          expect(result).toBeNull();
        }),
        { numRuns: 200 },
      );
    });

    it('rejects any string shorter than min length (1 char)', () => {
      fc.assert(
        fc.property(validNombreString(1, 1), (input: string) => {
          const control = new FormControl(input);
          const result = nombreCompletoValidator(control);
          expect(result).toEqual({ minLength: { requiredLength: MIN, actualLength: 1 } });
        }),
        { numRuns: 50 },
      );
    });

    it('rejects any string exceeding max length (101+ chars)', () => {
      fc.assert(
        fc.property(validNombreString(101, 120), (input: string) => {
          const control = new FormControl(input);
          const result = nombreCompletoValidator(control);
          expect(result).toEqual({ maxLength: { requiredLength: MAX, actualLength: input.length } });
        }),
        { numRuns: 100 },
      );
    });

    it('rejects strings with invalid characters (regardless of length)', () => {
      fc.assert(
        fc.property(
          invalidCharArbitrary.filter((s) => s.length >= MIN && s.length <= MAX),
          (input: string) => {
            const control = new FormControl(input);
            const result = nombreCompletoValidator(control);
            expect(result).not.toBeNull();
          },
        ),
        { numRuns: 200 },
      );
    });

    it('validator accepts iff regex matches AND length is in [min, max]', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 120 }), (input: string) => {
          const control = new FormControl(input);
          const result = nombreCompletoValidator(control);
          const matchesPattern = PATTERN.test(input);
          const validLength = input.length >= MIN && input.length <= MAX;
          const shouldAccept = matchesPattern && validLength;

          if (shouldAccept) {
            expect(result).toBeNull();
          } else {
            expect(result).not.toBeNull();
          }
        }),
        { numRuns: 500 },
      );
    });

    it('returns null for empty string (delegates to required validator)', () => {
      const control = new FormControl('');
      expect(nombreCompletoValidator(control)).toBeNull();
    });
  });

  describe('numeroCertificacionValidator', () => {
    const PATTERN = TEXT_VALIDATOR_PATTERNS.numeroCertificacion;
    const MIN = 1;
    const MAX = 50;

    it('accepts any string within valid charset and length [1, 50]', () => {
      fc.assert(
        fc.property(validCertString(MIN, MAX), (input: string) => {
          const control = new FormControl(input);
          const result = numeroCertificacionValidator(control);
          expect(result).toBeNull();
        }),
        { numRuns: 200 },
      );
    });

    it('rejects any string exceeding max length (51+ chars)', () => {
      fc.assert(
        fc.property(validCertString(51, 60), (input: string) => {
          const control = new FormControl(input);
          const result = numeroCertificacionValidator(control);
          expect(result).toEqual({ maxLength: { requiredLength: MAX, actualLength: input.length } });
        }),
        { numRuns: 100 },
      );
    });

    it('rejects strings with characters outside alphanumeric and hyphens', () => {
      fc.assert(
        fc.property(
          invalidCharArbitrary.filter((s) => s.length >= MIN && s.length <= MAX),
          (input: string) => {
            const control = new FormControl(input);
            const result = numeroCertificacionValidator(control);
            expect(result).not.toBeNull();
          },
        ),
        { numRuns: 200 },
      );
    });

    it('validator accepts iff regex matches AND length is in [min, max]', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 60 }), (input: string) => {
          const control = new FormControl(input);
          const result = numeroCertificacionValidator(control);
          const matchesPattern = PATTERN.test(input);
          const validLength = input.length >= MIN && input.length <= MAX;
          const shouldAccept = matchesPattern && validLength;

          if (shouldAccept) {
            expect(result).toBeNull();
          } else {
            expect(result).not.toBeNull();
          }
        }),
        { numRuns: 500 },
      );
    });

    it('returns null for empty string (delegates to required validator)', () => {
      const control = new FormControl('');
      expect(numeroCertificacionValidator(control)).toBeNull();
    });
  });

  describe('entidadCertificadoraOtraValidator', () => {
    const PATTERN = TEXT_VALIDATOR_PATTERNS.entidadCertificadoraOtra;
    const MIN = 2;
    const MAX = 100;

    it('accepts any string within valid charset and length [2, 100]', () => {
      fc.assert(
        fc.property(validEntidadString(MIN, MAX), (input: string) => {
          const control = new FormControl(input);
          const result = entidadCertificadoraOtraValidator(control);
          expect(result).toBeNull();
        }),
        { numRuns: 200 },
      );
    });

    it('rejects any string shorter than min length (1 char)', () => {
      fc.assert(
        fc.property(validEntidadString(1, 1), (input: string) => {
          const control = new FormControl(input);
          const result = entidadCertificadoraOtraValidator(control);
          expect(result).toEqual({ minLength: { requiredLength: MIN, actualLength: 1 } });
        }),
        { numRuns: 50 },
      );
    });

    it('rejects any string exceeding max length (101+ chars)', () => {
      fc.assert(
        fc.property(validEntidadString(101, 120), (input: string) => {
          const control = new FormControl(input);
          const result = entidadCertificadoraOtraValidator(control);
          expect(result).toEqual({ maxLength: { requiredLength: MAX, actualLength: input.length } });
        }),
        { numRuns: 100 },
      );
    });

    it('accepts strings with dots (valid char for entidad)', () => {
      fc.assert(
        fc.property(
          fc
            .tuple(validEntidadString(1, 45), fc.constantFrom('.', 'S.A.', 'Inc.', 'Ltd.'))
            .map(([prefix, dotPart]) => (prefix + dotPart).slice(0, MAX))
            .filter((s) => s.length >= MIN && s.length <= MAX && PATTERN.test(s)),
          (input: string) => {
            const control = new FormControl(input);
            const result = entidadCertificadoraOtraValidator(control);
            expect(result).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rejects strings with invalid characters (regardless of length)', () => {
      fc.assert(
        fc.property(
          invalidCharArbitrary.filter((s) => s.length >= MIN && s.length <= MAX),
          (input: string) => {
            const control = new FormControl(input);
            const result = entidadCertificadoraOtraValidator(control);
            expect(result).not.toBeNull();
          },
        ),
        { numRuns: 200 },
      );
    });

    it('validator accepts iff regex matches AND length is in [min, max]', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 120 }), (input: string) => {
          const control = new FormControl(input);
          const result = entidadCertificadoraOtraValidator(control);
          const matchesPattern = PATTERN.test(input);
          const validLength = input.length >= MIN && input.length <= MAX;
          const shouldAccept = matchesPattern && validLength;

          if (shouldAccept) {
            expect(result).toBeNull();
          } else {
            expect(result).not.toBeNull();
          }
        }),
        { numRuns: 500 },
      );
    });

    it('returns null for empty string (delegates to required validator)', () => {
      const control = new FormControl('');
      expect(entidadCertificadoraOtraValidator(control)).toBeNull();
    });
  });

  describe('Boundary length tests', () => {
    it('nombreCompleto: accepts exactly min length (2 chars)', () => {
      fc.assert(
        fc.property(validNombreString(2, 2), (input: string) => {
          const control = new FormControl(input);
          expect(nombreCompletoValidator(control)).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('nombreCompleto: accepts exactly max length (100 chars)', () => {
      fc.assert(
        fc.property(validNombreString(100, 100), (input: string) => {
          const control = new FormControl(input);
          expect(nombreCompletoValidator(control)).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('numeroCertificacion: accepts exactly min length (1 char)', () => {
      fc.assert(
        fc.property(validCertString(1, 1), (input: string) => {
          const control = new FormControl(input);
          expect(numeroCertificacionValidator(control)).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('numeroCertificacion: accepts exactly max length (50 chars)', () => {
      fc.assert(
        fc.property(validCertString(50, 50), (input: string) => {
          const control = new FormControl(input);
          expect(numeroCertificacionValidator(control)).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('entidadCertificadoraOtra: accepts exactly min length (2 chars)', () => {
      fc.assert(
        fc.property(validEntidadString(2, 2), (input: string) => {
          const control = new FormControl(input);
          expect(entidadCertificadoraOtraValidator(control)).toBeNull();
        }),
        { numRuns: 50 },
      );
    });

    it('entidadCertificadoraOtra: accepts exactly max length (100 chars)', () => {
      fc.assert(
        fc.property(validEntidadString(100, 100), (input: string) => {
          const control = new FormControl(input);
          expect(entidadCertificadoraOtraValidator(control)).toBeNull();
        }),
        { numRuns: 50 },
      );
    });
  });
});
