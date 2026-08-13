import { Component, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'tertiary' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  host: {
    '[class]': 'hostClass()',
    '[attr.id]': 'null',
  },
})
export class ButtonComponent {
  id = input<string>();
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  loading = input(false);
  type = input<'button' | 'submit' | 'reset'>('button');
  /** Se reenvía al <button> interno: el host es un custom element sin rol y el lector lo ignora. */
  ariaLabel = input<string>();
  /** Mismo motivo que ariaLabel: puesto sobre <app-button> el lector nunca anuncia el estado. */
  ariaExpanded = input<boolean>();
  /** Mismo motivo que ariaLabel: puesto sobre <app-button> no apunta a nada. */
  ariaControls = input<string>();

  protected readonly hostClass = computed(
    () => `ch-button ch-button--${this.variant()} ch-button--${this.size()}`
  );
}
