import { Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

let nextId = 0;

@Component({
  selector: 'app-select-input',
  templateUrl: './select-input.component.html',
  styleUrl: './select-input.component.scss',
  host: {
    class: 'ch-select-input',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectInputComponent),
      multi: true,
    },
  ],
})
export class SelectInputComponent implements ControlValueAccessor {
  label = input<string>();
  value = model('');
  options = input.required<SelectOption[]>();
  placeholder = input('Seleccionar...');
  error = input('');
  disabled = input(false);

  protected readonly inputId = `ch-select-input-${nextId++}`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly formDisabled = signal(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly hasError = computed(() => this.error().length > 0);

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

  protected onChangeEvent(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}
