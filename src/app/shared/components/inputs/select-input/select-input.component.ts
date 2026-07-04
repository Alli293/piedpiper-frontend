import { Component, computed, input, output } from '@angular/core';

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
})
export class SelectInputComponent {
  label = input<string>();
  options = input.required<SelectOption[]>();
  placeholder = input('Seleccionar...');
  error = input('');
  disabled = input(false);

  valueChange = output<string>();

  protected readonly inputId = `ch-select-input-${nextId++}`;
  protected readonly errorId = `${this.inputId}-error`;

  protected readonly hasError = computed(() => this.error().length > 0);

  protected onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.valueChange.emit(value);
  }
}
