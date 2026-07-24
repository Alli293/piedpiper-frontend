import { Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ChipOption {
  value: string;
  label: string;
}

let nextId = 0;

@Component({
  selector: 'app-chip-select',
  templateUrl: './chip-select.component.html',
  styleUrl: './chip-select.component.scss',
  host: {
    class: 'ch-chip-select',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipSelectComponent),
      multi: true,
    },
  ],
})
export class ChipSelectComponent implements ControlValueAccessor {
  label = input<string>();
  options = input.required<ChipOption[]>();
  multiple = input(false);
  error = input('');
  hint = input('');
  disabled = input(false);

  value = model<string | string[]>('');

  protected readonly groupId = `ch-chip-select-${nextId++}`;
  protected readonly labelId = `${this.groupId}-label`;
  protected readonly errorId = `${this.groupId}-error`;
  protected readonly hintId = `${this.groupId}-hint`;

  protected readonly formDisabled = signal(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly hasError = computed(() => this.error().length > 0);
  protected readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  private onChange: (value: string | string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | string[]): void {
    this.value.set(value ?? (this.multiple() ? [] : ''));
  }

  registerOnChange(fn: (value: string | string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected isActive(optionValue: string): boolean {
    const current = this.value();
    return this.multiple() ? (current as string[]).includes(optionValue) : current === optionValue;
  }

  protected toggle(optionValue: string): void {
    if (this.effectiveDisabled()) return;

    if (this.multiple()) {
      const current = this.value() as string[];
      const next = current.includes(optionValue)
        ? current.filter((value) => value !== optionValue)
        : [...current, optionValue];
      this.value.set(next);
      this.onChange(next);
    } else {
      this.value.set(optionValue);
      this.onChange(optionValue);
    }

    this.onTouched();
  }
}
