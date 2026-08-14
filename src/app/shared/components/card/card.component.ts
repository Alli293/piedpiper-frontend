import { Component, computed, input } from '@angular/core';

export type CardVariant = 'elevated' | 'outlined';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  host: {
    '[class]': 'hostClass()',
  },
})
export class CardComponent {
  variant = input<CardVariant>('elevated');
  padding = input<CardPadding>('md');

  protected readonly hostClass = computed(
    () => `ch-card ch-card--${this.variant()} ch-card--padding-${this.padding()}`
  );
}
