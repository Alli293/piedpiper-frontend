import { Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TextInputComponent } from '../text-input/text-input.component';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-password-input',
  templateUrl: './password-input.component.html',
  styleUrl: './password-input.component.scss',
  host: {
    class: 'ch-password-input',
  },
  imports: [TextInputComponent, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
})
export class PasswordInputComponent implements ControlValueAccessor {
  id = input<string>();
  label = input<string>();
  placeholder = input('');
  autocomplete = input('');
  error = input('');
  hint = input('');
  required = input(false);

  value = model('');

  protected readonly mostrar = signal(false);
  protected readonly type = computed(() => (this.mostrar() ? 'text' : 'password'));

  protected readonly formDisabled = signal(false);

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

  protected onValueChange(value: string): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected alternarVisibilidad(): void {
    this.mostrar.update((v) => !v);
  }
}
