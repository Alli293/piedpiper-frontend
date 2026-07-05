import { Component, computed, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../icon/icon-registry';

export type SemanticCardVariant = 'success' | 'warning' | 'danger' | 'info' | 'new';

const DEFAULT_ICONS: Record<SemanticCardVariant, IconName> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  new: 'new',
};

@Component({
  selector: 'app-semantic-card',
  imports: [IconComponent],
  templateUrl: './semantic-card.component.html',
  styleUrl: './semantic-card.component.scss',
  host: {
    '[class]': 'hostClass()',
  },
})
export class SemanticCardComponent {
  variant = input<SemanticCardVariant>('info');
  title = input('');
  text = input('');
  icon = input<IconName | null>(null);

  protected readonly hostClass = computed(() => `ch-semantic-card ch-semantic-card--${this.variant()}`);
  protected readonly effectiveIcon = computed(() => this.icon() ?? DEFAULT_ICONS[this.variant()]);
}
