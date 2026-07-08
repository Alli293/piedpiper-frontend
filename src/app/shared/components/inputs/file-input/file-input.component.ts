import { Component, computed, ElementRef, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const MAX_FILE_SIZE = 10_485_760; // 10 MB
const ACCEPTED_MIME_TYPE = 'application/pdf';

let nextId = 0;

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.scss',
  host: {
    class: 'ch-file-input',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputComponent),
      multi: true,
    },
  ],
})
export class FileInputComponent implements ControlValueAccessor {
  label = input<string>();
  error = input('');
  hint = input('');
  disabled = input(false);
  required = input(false);
  accept = input(ACCEPTED_MIME_TYPE);
  maxSize = input(MAX_FILE_SIZE);

  protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInputRef');

  protected readonly inputId = `ch-file-input-${nextId++}`;
  protected readonly errorId = `${this.inputId}-error`;
  protected readonly hintId = `${this.inputId}-hint`;

  protected readonly formDisabled = signal(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly fileName = signal<string | null>(null);
  protected readonly localError = signal<string | null>(null);

  protected readonly displayError = computed(() => this.error() || this.localError() || '');
  protected readonly hasError = computed(() => this.displayError().length > 0);

  protected readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  private onChange: (value: File | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(_value: File | null): void {
    if (!_value) {
      this.fileName.set(null);
      this.localError.set(null);
      const inputEl = this.fileInput();
      if (inputEl) {
        inputEl.nativeElement.value = '';
      }
    }
  }

  registerOnChange(fn: (value: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.onTouched();

    if (!file) {
      this.fileName.set(null);
      this.localError.set(null);
      this.onChange(null);
      return;
    }

    const validationError = this.validateFile(file);

    if (validationError) {
      this.localError.set(validationError);
      this.fileName.set(null);
      this.onChange(null);
      input.value = '';
      return;
    }

    this.localError.set(null);
    this.fileName.set(file.name);
    this.onChange(file);
  }

  protected triggerFileInput(): void {
    const inputEl = this.fileInput();
    if (inputEl && !this.effectiveDisabled()) {
      inputEl.nativeElement.click();
    }
  }

  protected removeFile(): void {
    this.fileName.set(null);
    this.localError.set(null);
    this.onChange(null);
    const inputEl = this.fileInput();
    if (inputEl) {
      inputEl.nativeElement.value = '';
    }
  }

  private validateFile(file: File): string | null {
    if (file.type !== this.accept()) {
      return 'Solo se permiten archivos PDF.';
    }

    if (file.size > this.maxSize()) {
      return 'El archivo excede el tamaño máximo de 10 MB.';
    }

    return null;
  }
}
