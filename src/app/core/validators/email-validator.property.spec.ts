// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidEmail } from './email-validator';

/**
 * Property 2: Email format validation
 *
 * *For any* string, the email validator SHALL accept it if and only if it
 * contains exactly one "@" character followed by a domain with at least one
 * dot (format `local@domain.tld`).
 *
 * **Validates: Requirements 2.2**
 */
describe('Property 2: Email format validation', () => {
  /**
   * Arbitrary that generates valid email-shaped strings: local@domain.tld
   * - local part: 1+ alphanumeric/dot/underscore/hyphen characters
   * - domain: 1+ alphanumeric/hyphen characters
   * - tld: 2-6 alpha characters
   */
  const localPartArb = fc.string({ minLength: 1, maxLength: 20 }).map((s: string) => {
    const cleaned = s.replace(/@/g, 'a').replace(/[^a-zA-Z0-9._-]/g, 'x');
    return cleaned.length > 0 ? cleaned.slice(0, 20) : 'user';
  });

  const domainPartArb = fc.string({ minLength: 1, maxLength: 15 }).map((s: string) => {
    const cleaned = s
      .replace(/@/g, 'a')
      .replace(/\./g, 'x')
      .replace(/[^a-zA-Z0-9-]/g, 'x')
      .replace(/^-/, 'a')
      .replace(/-$/, 'a');
    return cleaned.length > 0 ? cleaned.slice(0, 15) : 'domain';
  });

  const tldArb = fc
    .integer({ min: 2, max: 6 })
    .chain((len: number) =>
      fc
        .tuple(...Array.from({ length: len }, () => fc.integer({ min: 97, max: 122 })))
        .map((codes: number[]) => String.fromCharCode(...codes)),
    );

  const validEmailArb = fc
    .tuple(localPartArb, domainPartArb, tldArb)
    .map(([local, domain, tld]: [string, string, string]) => `${local}@${domain}.${tld}`);

  /**
   * Arbitrary that generates strings without any "@" character
   */
  const noAtArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s: string) => !s.includes('@'));

  /**
   * Arbitrary that generates strings with multiple "@" characters (at least 2)
   */
  const multipleAtArb = fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 10 }).map((s: string) => s.replace(/@/g, 'a')),
      fc.string({ minLength: 1, maxLength: 10 }).map((s: string) => s.replace(/@/g, 'b')),
      fc.string({ minLength: 1, maxLength: 10 }).map((s: string) => s.replace(/@/g, 'c')),
    )
    .map(([a, b, c]: [string, string, string]) => `${a}@${b}@${c}`);

  /**
   * Arbitrary that generates strings with exactly one "@" but no dot in domain
   */
  const noDotInDomainArb = fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 15 }).map((s: string) => {
        const cleaned = s.replace(/@/g, 'a').replace(/[^a-zA-Z0-9._-]/g, 'x');
        return cleaned.length > 0 ? cleaned : 'user';
      }),
      fc.string({ minLength: 1, maxLength: 15 }).map((s: string) => {
        const cleaned = s
          .replace(/@/g, 'a')
          .replace(/\./g, 'x')
          .replace(/[^a-zA-Z0-9-]/g, 'x');
        return cleaned.length > 0 ? cleaned : 'domain';
      }),
    )
    .map(([local, domain]: [string, string]) => `${local}@${domain}`);

  it('should accept valid email-shaped strings (local@domain.tld)', () => {
    fc.assert(
      fc.property(validEmailArb, (email: string) => {
        expect(isValidEmail(email)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('should reject strings without "@"', () => {
    fc.assert(
      fc.property(noAtArb, (str: string) => {
        expect(isValidEmail(str)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('should reject strings with multiple "@" characters', () => {
    fc.assert(
      fc.property(multipleAtArb, (str: string) => {
        expect(isValidEmail(str)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('should reject strings with "@" but no dot in domain', () => {
    fc.assert(
      fc.property(noDotInDomainArb, (str: string) => {
        expect(isValidEmail(str)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('should return false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('isValidEmail biconditional: accepts iff exactly one @ and domain has valid dot structure', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 60 }), (input: string) => {
        const atCount = (input.match(/@/g) || []).length;
        const result = isValidEmail(input);

        if (atCount !== 1) {
          // Must reject - not exactly one @
          expect(result).toBe(false);
        } else {
          const atIndex = input.indexOf('@');
          const local = input.substring(0, atIndex);
          const domain = input.substring(atIndex + 1);
          const dotIndex = domain.indexOf('.');
          const hasDotInDomain = dotIndex > 0 && dotIndex < domain.length - 1;
          const partsValid = domain.split('.').every((p: string) => p.length > 0);

          if (local.length === 0 || domain.length === 0 || !hasDotInDomain || !partsValid) {
            expect(result).toBe(false);
          } else {
            expect(result).toBe(true);
          }
        }
      }),
      { numRuns: 500 },
    );
  });
});
