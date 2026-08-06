import { Component, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

export type CardStatTone = 'sky' | 'green';

@Component({
  selector: 'app-card-stat',
  imports: [IconComponent],
  templateUrl: './card-stat.component.html',
  styleUrl: './card-stat.component.scss',
  host: {
    class: 'ch-card-stat',
    '[class.ch-card-stat--green]': "tono() === 'green'",
    '[class.ch-card-stat--with-icon]': '!!icon()',
  },
})
export class CardStatComponent {
  value = input.required<string | number>();
  label = input.required<string>();
  delta = input('');
  tono = input<CardStatTone>('sky');
  icon = input<IconName | null>(null);
}
