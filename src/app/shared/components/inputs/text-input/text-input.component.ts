import { Component, computed, input, output } from '@angular/core';

export type TextInputType = 'text' | 'email' | 'password' | 'number';

let nextId = 0;

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss',
  host: {
    class: 'ch-text-input',
  },
})
export class TextInputComponent {
  label = input<string>();
  value = input('');
  placeholder = input('');
  type = input<TextInputType>('text');
  error = input('');
  hint = input('');
  disabled = input(false);
  required = input(false);

  valueChange = output<string>();

  protected readonly inputId = `ch-text-input-${nextId++}`;
  protected readonly hintId = `${this.inputId}-hint`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly hasError = computed(() => this.error().length > 0);
  protected readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(value);
  }
}
