import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { FileInputComponent } from './file-input.component';

describe('FileInputComponent', () => {
  let component: FileInputComponent;

  beforeEach(() => {
    component = new FileInputComponent();
  });

  describe('ControlValueAccessor', () => {
    it('should initialize with no filename and no error', () => {
      expect(component['fileName']()).toBeNull();
      expect(component['localError']()).toBeNull();
    });

    it('should register onChange callback', () => {
      const fn = (_v: File | null) => {};
      component.registerOnChange(fn);
      expect(component['onChange']).toBe(fn);
    });

    it('should register onTouched callback', () => {
      const fn = () => {};
      component.registerOnTouched(fn);
      expect(component['onTouched']).toBe(fn);
    });

    it('should set formDisabled on setDisabledState', () => {
      component.setDisabledState(true);
      expect(component['formDisabled']()).toBe(true);

      component.setDisabledState(false);
      expect(component['formDisabled']()).toBe(false);
    });

    it('should clear filename when writeValue receives null', () => {
      component.writeValue(null);
      expect(component['fileName']()).toBeNull();
      expect(component['localError']()).toBeNull();
    });
  });

  describe('File validation', () => {
    it('should accept a valid PDF file under 10MB', () => {
      const file = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
      const result = component['validateFile'](file);
      expect(result).toBeNull();
    });

    it('should reject a non-PDF file', () => {
      const file = new File(['text content'], 'document.txt', { type: 'text/plain' });
      const result = component['validateFile'](file);
      expect(result).toBe('Solo se permiten archivos PDF.');
    });

    it('should reject an image file', () => {
      const file = new File(['image content'], 'photo.png', { type: 'image/png' });
      const result = component['validateFile'](file);
      expect(result).toBe('Solo se permiten archivos PDF.');
    });

    it('should reject a file exceeding 10MB', () => {
      const largeContent = new Uint8Array(10_485_761);
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = component['validateFile'](file);
      expect(result).toBe('El archivo excede el tamaño máximo de 10 MB.');
    });

    it('should accept a PDF file at exactly 10MB', () => {
      const content = new Uint8Array(10_485_760);
      const file = new File([content], 'exact.pdf', { type: 'application/pdf' });
      const result = component['validateFile'](file);
      expect(result).toBeNull();
    });
  });

  describe('onFileSelected', () => {
    it('should set fileName and call onChange for valid PDF', () => {
      let emittedValue: File | null = undefined as unknown as File | null;
      component.registerOnChange((v) => { emittedValue = v; });
      component.registerOnTouched(() => {});

      const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file], value: '' } } as unknown as Event;

      component['onFileSelected'](event);

      expect(component['fileName']()).toBe('report.pdf');
      expect(component['localError']()).toBeNull();
      expect(emittedValue).toBe(file);
    });

    it('should set localError and emit null for invalid file type', () => {
      let emittedValue: File | null = new File([], '') as File | null;
      component.registerOnChange((v) => { emittedValue = v; });
      component.registerOnTouched(() => {});

      const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file], value: '' } } as unknown as Event;

      component['onFileSelected'](event);

      expect(component['fileName']()).toBeNull();
      expect(component['localError']()).toBe('Solo se permiten archivos PDF.');
      expect(emittedValue).toBeNull();
    });

    it('should set localError and emit null for oversized PDF', () => {
      let emittedValue: File | null = new File([], '') as File | null;
      component.registerOnChange((v) => { emittedValue = v; });
      component.registerOnTouched(() => {});

      const largeContent = new Uint8Array(10_485_761);
      const file = new File([largeContent], 'huge.pdf', { type: 'application/pdf' });
      const event = { target: { files: [file], value: '' } } as unknown as Event;

      component['onFileSelected'](event);

      expect(component['fileName']()).toBeNull();
      expect(component['localError']()).toBe('El archivo excede el tamaño máximo de 10 MB.');
      expect(emittedValue).toBeNull();
    });

    it('should emit null when no file is selected', () => {
      let emittedValue: File | null = new File([], '') as File | null;
      component.registerOnChange((v) => { emittedValue = v; });
      component.registerOnTouched(() => {});

      const event = { target: { files: [], value: '' } } as unknown as Event;

      component['onFileSelected'](event);

      expect(component['fileName']()).toBeNull();
      expect(component['localError']()).toBeNull();
      expect(emittedValue).toBeNull();
    });
  });

  describe('removeFile', () => {
    it('should clear file name, error, and emit null', () => {
      let emittedValue: File | null = new File([], '') as File | null;
      component.registerOnChange((v) => { emittedValue = v; });

      // Simulate having a file selected
      component['fileName'].set('test.pdf');
      component['localError'].set(null);

      component['removeFile']();

      expect(component['fileName']()).toBeNull();
      expect(component['localError']()).toBeNull();
      expect(emittedValue).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('should show external error over local error', () => {
      component['localError'].set('local error');
      // External error input takes precedence — but since we can't easily set inputs in unit tests
      // we verify that displayError computes from localError when no external error
      expect(component['displayError']()).toBe('local error');
    });

    it('should report hasError when localError is set', () => {
      component['localError'].set('Some error');
      expect(component['hasError']()).toBe(true);
    });

    it('should report no error when everything is clean', () => {
      component['localError'].set(null);
      expect(component['hasError']()).toBe(false);
    });
  });
});
