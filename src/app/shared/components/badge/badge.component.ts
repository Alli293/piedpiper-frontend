import { Component, computed, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

export type BadgeVariant =
  'success' | 'warning' | 'danger' | 'danger-solid' | 'info' | 'new' | 'neutral';

@Component({
  selector: 'app-badge',
  imports: [IconComponent],
  template: `
    @if (icon()) {
      <app-icon class="ch-badge__icon" [name]="icon()!" [size]="12" />
    }
    <span class="ch-badge__label"><ng-content /></span>
  `,
  styleUrl: './badge.component.scss',
  host: {
    '[class]': 'hostClass()',
  },
})
export class BadgeComponent {
  variant = input<BadgeVariant>('neutral');
  icon = input<IconName | null>(null);

  protected readonly hostClass = computed(
    () => `ch-badge ch-badge--${this.variant()}${this.icon() ? ' ch-badge--with-icon' : ''}`
  );
}
