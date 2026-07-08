// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidExperienceYears, numericRangeValidator } from './numeric-range-validator';

/**
 * Property 5: Numeric range validation
 *
 * For any numeric value, the años-experiencia validator SHALL accept it
 * if and only if it is an integer in the range [0, 60].
 *
 * **Validates: Requirements 2.8**
 */
describe('Property 5: Numeric range validation', () => {
  it('should accept any integer in [0, 60]', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 60 }), (value: number) => {
        expect(isValidExperienceYears(value)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('should reject any integer below 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: -1 }), (value: number) => {
        expect(isValidExperienceYears(value)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('should reject any integer above 60', () => {
    fc.assert(
      fc.property(fc.integer({ min: 61, max: 1000 }), (value: number) => {
        expect(isValidExperienceYears(value)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('should reject any non-integer (floating-point) value', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1000, max: 1000, noNaN: true }).filter((v: number) => !Number.isInteger(v)),
        (value: number) => {
          expect(isValidExperienceYears(value)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('should satisfy the biconditional: accept iff value is an integer in [0, 60]', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -500, max: 500 }),
          fc.double({ min: -500, max: 500, noNaN: true }),
        ),
        (value: number) => {
          const shouldBeValid = Number.isInteger(value) && value >= 0 && value <= 60;
          expect(isValidExperienceYears(value)).toBe(shouldBeValid);
        },
      ),
      { numRuns: 500 },
    );
  });

  it('should return false for null and undefined', () => {
    expect(isValidExperienceYears(null)).toBe(false);
    expect(isValidExperienceYears(undefined)).toBe(false);
  });

  it('should accept boundary values 0 and 60', () => {
    expect(isValidExperienceYears(0)).toBe(true);
    expect(isValidExperienceYears(60)).toBe(true);
  });

  it('should reject boundary values -1 and 61', () => {
    expect(isValidExperienceYears(-1)).toBe(false);
    expect(isValidExperienceYears(61)).toBe(false);
  });
});
