import { Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type TextInputType = 'text' | 'email' | 'password' | 'number';

let nextId = 0;

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss',
  host: {
    class: 'ch-text-input',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
})
export class TextInputComponent implements ControlValueAccessor {
  label = input<string>();
  value = model('');
  placeholder = input('');
  type = input<TextInputType>('text');
  error = input('');
  hint = input('');
  disabled = input(false);
  required = input(false);

  protected readonly inputId = `ch-text-input-${nextId++}`;
  protected readonly hintId = `${this.inputId}-hint`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly formDisabled = signal(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly hasError = computed(() => this.error().length > 0);
  protected readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
