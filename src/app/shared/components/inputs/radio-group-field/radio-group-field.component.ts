import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RadioComponent } from '../radio/radio.component';
import { RadioGroupDirective } from '../radio/radio-group.directive';
import { SelectOption } from '../select-input/select-input.component';

let nextId = 0;

@Component({
  selector: 'app-radio-group-field',
  imports: [RadioComponent, RadioGroupDirective],
  templateUrl: './radio-group-field.component.html',
  styleUrl: './radio-group-field.component.scss',
  host: {
    class: 'ch-radio-group-field',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupFieldComponent),
      multi: true,
    },
  ],
})
export class RadioGroupFieldComponent implements ControlValueAccessor {
  label = input<string>();
  options = input.required<SelectOption[]>();
  error = input('');
  disabled = input(false);

  protected readonly groupId = `ch-radio-group-field-${nextId++}`;
  protected readonly labelId = `${this.groupId}-label`;
  protected readonly errorId = `${this.groupId}-error`;

  protected readonly value = signal<string | null>(null);
  protected readonly formDisabled = signal(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly hasError = computed(() => this.error().length > 0);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected onGroupChange(value: string | null): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}
