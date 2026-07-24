import { Component, input } from '@angular/core';

export type CardStatTone = 'sky' | 'green';

@Component({
  selector: 'app-card-stat',
  templateUrl: './card-stat.component.html',
  styleUrl: './card-stat.component.scss',
  host: {
    class: 'ch-card-stat',
    '[class.ch-card-stat--green]': "tono() === 'green'",
  },
})
export class CardStatComponent {
  value = input.required<string | number>();
  label = input.required<string>();
  delta = input('');
  tono = input<CardStatTone>('sky');
}
