import { Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent, IconName } from '../../icon/icon.component';

export interface SelectOption {
  value: string;
  label: string;
}

type SelectInputVariant = 'default' | 'compact';

let nextId = 0;

@Component({
  selector: 'app-select-input',
  imports: [IconComponent],
  templateUrl: './select-input.component.html',
  styleUrl: './select-input.component.scss',
  host: {
    class: 'ch-select-input',
    '[class.ch-select-input--compact]': 'variant() === "compact"',
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
  hint = input('');
  disabled = input(false);
  ariaLabel = input<string | null>(null);
  icon = input<IconName | null>(null);
  variant = input<SelectInputVariant>('default');

  protected readonly inputId = `ch-select-input-${nextId++}`;
  protected readonly errorId = `${this.inputId}-error`;
  protected readonly hintId = `${this.inputId}-hint`;

  protected readonly formDisabled = signal(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly hasError = computed(() => this.error().length > 0);
  protected readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });
  protected readonly accessibleLabel = computed(() => this.ariaLabel() ?? this.label() ?? null);
  protected readonly hasIcon = computed(() => this.icon() !== null);

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
