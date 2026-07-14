import {
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { toIsoDateString } from '../../../utils/date.utils';

let nextId = 0;

@Component({
  selector: 'app-date-input',
  imports: [IconComponent],
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.scss',
  host: {
    class: 'ch-text-input',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
})
export class DateInputComponent implements ControlValueAccessor {
  label = input<string>();
  value = model<Date | null>(null);
  error = input('');
  hint = input('');
  disabled = input(false);
  required = input(false);
  max = input<Date | undefined>();
  min = input<Date | undefined>();

  private readonly fieldRef = viewChild<ElementRef<HTMLInputElement>>('field');

  protected readonly inputId = `ch-date-input-${nextId++}`;
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

  protected readonly displayValue = computed(() => {
    const current = this.value();
    return current ? toIsoDateString(current) : '';
  });
  protected readonly maxAttr = computed(() => {
    const max = this.max();
    return max ? toIsoDateString(max) : null;
  });
  protected readonly minAttr = computed(() => {
    const min = this.min();
    return min ? toIsoDateString(min) : null;
  });

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Date | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsDate;
    this.value.set(value);
    this.onChange(value);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected openPicker(): void {
    this.fieldRef()?.nativeElement.showPicker?.();
  }
}
