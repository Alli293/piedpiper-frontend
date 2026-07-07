import { Component, computed, inject, input } from '@angular/core';
import { RadioGroupDirective } from './radio-group.directive';

let nextId = 0;

@Component({
  selector: 'app-radio',
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  host: {
    class: 'ch-radio',
  },
})
export class RadioComponent {
  private readonly group = inject(RadioGroupDirective, { optional: true });

  value = input.required<string>();
  disabled = input(false);
  label = input('');

  protected readonly inputId = `ch-radio-${nextId++}`;
  protected readonly name = computed(() => this.group?.name() ?? '');
  protected readonly checked = computed(() => this.group?.value() === this.value());
  protected readonly effectiveDisabled = computed(
    () => this.disabled() || (this.group?.disabled() ?? false)
  );

  protected onChange(): void {
    if (this.effectiveDisabled()) return;
    this.group?.select(this.value());
  }
}
