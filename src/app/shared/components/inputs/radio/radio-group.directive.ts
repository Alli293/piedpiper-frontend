import { Directive, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextName = 0;

/**
 * Coordinates a single selected value across sibling `app-radio` instances.
 * Reactive Forms integration (ControlValueAccessor) lives here rather than on
 * each `app-radio`, since the group — not the individual option — is the control.
 */
@Directive({
  selector: '[appRadioGroup]',
  host: {
    role: 'radiogroup',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupDirective),
      multi: true,
    },
  ],
})
export class RadioGroupDirective implements ControlValueAccessor {
  name = input(`ch-radio-group-${nextName++}`);
  value = model<string | null>(null);

  protected readonly formDisabled = signal(false);
  readonly disabled = this.formDisabled.asReadonly();

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value);
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

  select(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}
