import { FormControl, FormGroup } from '@angular/forms';
import {
  passwordValidator,
  matchPasswordValidator,
  futureDateValidator,
  pdfValidator,
  textFieldValidator,
} from './form-validators';

describe('passwordValidator', () => {
  it('should return null for empty value (required handles it)', () => {
    const control = new FormControl('');
    expect(passwordValidator(control)).toBeNull();
  });

  it('should return passwordMinLength for strings shorter than 8 chars', () => {
    const control = new FormControl('abc12');
    expect(passwordValidator(control)).toEqual({ passwordMinLength: true });
  });

  it('should return passwordMaxLength for strings longer than 64 chars', () => {
    const control = new FormControl('a1' + 'x'.repeat(63));
    expect(passwordValidator(control)).toEqual({ passwordMaxLength: true });
  });

  it('should return passwordComposition if no digit present', () => {
    const control = new FormControl('abcdefgh');
    expect(passwordValidator(control)).toEqual({ passwordComposition: true });
  });

  it('should return passwordComposition if no letter present', () => {
    const control = new FormControl('12345678');
    expect(passwordValidator(control)).toEqual({ passwordComposition: true });
  });

  it('should return null for valid password with letters and digits', () => {
    const control = new FormControl('Password1');
    expect(passwordValidator(control)).toBeNull();
  });

  it('should accept exactly 8 characters with letter and digit', () => {
    const control = new FormControl('abcdefg1');
    expect(passwordValidator(control)).toBeNull();
  });

  it('should accept exactly 64 characters with letter and digit', () => {
    const control = new FormControl('a1' + 'b'.repeat(62));
    expect(passwordValidator(control)).toBeNull();
  });
});

describe('matchPasswordValidator', () => {
  it('should return null when control has no parent', () => {
    const control = new FormControl('test');
    expect(matchPasswordValidator(control)).toBeNull();
  });

  it('should return null for empty confirm value (required handles it)', () => {
    const group = new FormGroup({
      contrasena: new FormControl('Password1'),
      confirmarContrasena: new FormControl(''),
    });
    expect(matchPasswordValidator(group.get('confirmarContrasena')!)).toBeNull();
  });

  it('should return passwordMismatch when passwords do not match', () => {
    const group = new FormGroup({
      contrasena: new FormControl('Password1'),
      confirmarContrasena: new FormControl('DifferentPass1'),
    });
    expect(matchPasswordValidator(group.get('confirmarContrasena')!)).toEqual({
      passwordMismatch: true,
    });
  });

  it('should return null when passwords match', () => {
    const group = new FormGroup({
      contrasena: new FormControl('Password1'),
      confirmarContrasena: new FormControl('Password1'),
    });
    expect(matchPasswordValidator(group.get('confirmarContrasena')!)).toBeNull();
  });
});

describe('futureDateValidator', () => {
  it('should return null for empty value', () => {
    const control = new FormControl('');
    expect(futureDateValidator(control)).toBeNull();
  });

  it('should return futureDate for a past date', () => {
    const control = new FormControl('2020-01-01');
    expect(futureDateValidator(control)).toEqual({ futureDate: true });
  });

  it('should return null for today', () => {
    const today = new Date();
    const formatted = today.toISOString().split('T')[0];
    const control = new FormControl(formatted);
    expect(futureDateValidator(control)).toBeNull();
  });

  it('should return null for a future date', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const formatted = future.toISOString().split('T')[0];
    const control = new FormControl(formatted);
    expect(futureDateValidator(control)).toBeNull();
  });
});

describe('pdfValidator', () => {
  it('should return null for null/undefined value', () => {
    const control = new FormControl(null);
    expect(pdfValidator(control)).toBeNull();
  });

  it('should return invalidFileType for non-PDF file', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const control = new FormControl(file);
    expect(pdfValidator(control)).toEqual({ invalidFileType: true });
  });

  it('should return fileTooLarge for file over 10MB', () => {
    const largeContent = new Uint8Array(10485761); // Just over 10MB
    const file = new File([largeContent], 'big.pdf', { type: 'application/pdf' });
    const control = new FormControl(file);
    expect(pdfValidator(control)).toEqual({ fileTooLarge: true });
  });

  it('should return null for valid PDF under 10MB', () => {
    const file = new File(['pdf content'], 'valid.pdf', { type: 'application/pdf' });
    const control = new FormControl(file);
    expect(pdfValidator(control)).toBeNull();
  });

  it('should return null for exactly 10MB PDF', () => {
    const content = new Uint8Array(10485760); // Exactly 10MB
    const file = new File([content], 'exact.pdf', { type: 'application/pdf' });
    const control = new FormControl(file);
    expect(pdfValidator(control)).toBeNull();
  });
});

describe('textFieldValidator', () => {
  const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-]+$/;

  it('should return null for empty value', () => {
    const validator = textFieldValidator(namePattern, 2, 100);
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return minLength error for too short value', () => {
    const validator = textFieldValidator(namePattern, 2, 100);
    const control = new FormControl('A');
    expect(validator(control)).toEqual({ minLength: { requiredLength: 2, actualLength: 1 } });
  });

  it('should return maxLength error for too long value', () => {
    const validator = textFieldValidator(namePattern, 2, 5);
    const control = new FormControl('Abcdef');
    expect(validator(control)).toEqual({ maxLength: { requiredLength: 5, actualLength: 6 } });
  });

  it('should return pattern error for invalid characters', () => {
    const validator = textFieldValidator(namePattern, 2, 100);
    const control = new FormControl('Name123');
    expect(validator(control)).toEqual({ pattern: true });
  });

  it('should return null for valid value', () => {
    const validator = textFieldValidator(namePattern, 2, 100);
    const control = new FormControl('Juan Pérez-García');
    expect(validator(control)).toBeNull();
  });

  it('should work with alphanumeric pattern for certificacion', () => {
    const certPattern = /^[a-zA-Z0-9\-]+$/;
    const validator = textFieldValidator(certPattern, 1, 50);
    const control = new FormControl('CERT-2024-001');
    expect(validator(control)).toBeNull();
  });
});
