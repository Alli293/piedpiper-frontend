// @ts-nocheck
import { FormControl } from '@angular/forms';
import fc from 'fast-check';
import { isValidPassword, passwordValidator } from './password-validator';

/**
 * Property 3: Password composition validation
 *
 * For any string, the password validator SHALL accept it if and only if
 * it has length between 8 and 64 characters inclusive AND contains at least
 * one letter AND at least one digit.
 *
 * **Validates: Requirements 2.3**
 */
describe('Password Validator - Property-Based Tests', () => {
  describe('Property 3: Password composition validation', () => {
    it('should accept any valid password (8-64 chars, at least 1 letter + 1 digit)', () => {
      fc.assert(
        fc.property(
          fc.gen().map((gen) => {
            // Generate a valid password: 8-64 chars, guaranteed 1 letter + 1 digit
            const length = gen(fc.integer, { min: 8, max: 64 });
            // Reserve 1 slot for a letter and 1 slot for a digit
            const letter = gen(fc.char().filter((c) => /[a-zA-Z]/.test(c)));
            const digit = gen(fc.char().filter((c) => /\d/.test(c)));
            // Fill the rest with printable ASCII chars
            const restLength = length - 2;
            const rest = gen(
              fc.stringOf(fc.char().filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126), {
                minLength: restLength,
                maxLength: restLength,
              }),
            );
            // Shuffle the letter and digit into random positions
            const combined = rest + letter + digit;
            const chars = combined.split('');
            // Simple shuffle using generated indices
            for (let i = chars.length - 1; i > 0; i--) {
              const j = gen(fc.integer, { min: 0, max: i });
              [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            return chars.join('');
          }),
          (password) => {
            // The pure function should accept
            expect(isValidPassword(password)).toBe(true);
            // The Angular validator should return null (no errors)
            const control = new FormControl(password);
            expect(passwordValidator(control)).toBeNull();
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject any string shorter than 8 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 7 }).filter((s) => s.length >= 1),
          (shortString) => {
            expect(isValidPassword(shortString)).toBe(false);
            const control = new FormControl(shortString);
            const result = passwordValidator(control);
            expect(result).not.toBeNull();
            expect(result).toEqual({ passwordMinLength: true });
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject any string longer than 64 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 65, maxLength: 200 }),
          (longString) => {
            expect(isValidPassword(longString)).toBe(false);
            const control = new FormControl(longString);
            const result = passwordValidator(control);
            expect(result).not.toBeNull();
            expect(result).toEqual({ passwordMaxLength: true });
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject strings with only letters (no digits)', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.char().filter((c) => /[a-zA-Z]/.test(c)), { minLength: 8, maxLength: 64 }),
          (lettersOnly) => {
            expect(isValidPassword(lettersOnly)).toBe(false);
            const control = new FormControl(lettersOnly);
            const result = passwordValidator(control);
            expect(result).not.toBeNull();
            expect(result).toEqual({ passwordComposition: true });
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should reject strings with only digits (no letters)', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.char().filter((c) => /\d/.test(c)), { minLength: 8, maxLength: 64 }),
          (digitsOnly) => {
            expect(isValidPassword(digitsOnly)).toBe(false);
            const control = new FormControl(digitsOnly);
            const result = passwordValidator(control);
            expect(result).not.toBeNull();
            expect(result).toEqual({ passwordComposition: true });
          },
        ),
        { numRuns: 200 },
      );
    });

    it('should return null for empty value (required validator handles empty)', () => {
      const control = new FormControl('');
      expect(passwordValidator(control)).toBeNull();
    });

    it('should satisfy the biconditional: accept iff length 8-64, has letter, and has digit', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (arbitraryString) => {
            const len = arbitraryString.length;
            const hasLetter = /[a-zA-Z]/.test(arbitraryString);
            const hasDigit = /\d/.test(arbitraryString);
            const shouldBeValid = len >= 8 && len <= 64 && hasLetter && hasDigit;

            expect(isValidPassword(arbitraryString)).toBe(shouldBeValid);
          },
        ),
        { numRuns: 500 },
      );
    });
  });
});
