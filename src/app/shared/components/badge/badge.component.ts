import { Component, computed, input } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-badge',
  template: `<span class="ch-badge__label"><ng-content /></span>`,
  styleUrl: './badge.component.scss',
  host: {
    '[class]': 'hostClass()',
  },
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');

  protected readonly hostClass = computed(() => `ch-badge ch-badge--${this.variant()}`);
}
