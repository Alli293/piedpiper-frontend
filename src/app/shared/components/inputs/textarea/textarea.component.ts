import { Component, computed, input, output } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  host: {
    class: 'ch-textarea',
  },
})
export class TextareaComponent {
  label = input<string>();
  placeholder = input('');
  rows = input(4);
  error = input('');
  hint = input('');
  disabled = input(false);

  valueChange = output<string>();

  protected readonly inputId = `ch-textarea-${nextId++}`;
  protected readonly hintId = `${this.inputId}-hint`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly hasError = computed(() => this.error().length > 0);
  protected readonly describedBy = computed(() => {
    if (this.hasError()) return this.errorId;
    if (this.hint()) return this.hintId;
    return null;
  });

  protected onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.valueChange.emit(value);
  }
}
