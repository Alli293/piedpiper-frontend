import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card-stat',
  templateUrl: './card-stat.component.html',
  styleUrl: './card-stat.component.scss',
  host: {
    class: 'ch-card-stat',
  },
})
export class CardStatComponent {
  value = input.required<string | number>();
  label = input.required<string>();
  delta = input('');
}
