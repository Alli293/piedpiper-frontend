import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
  host: {
    class: 'ch-stat-card',
  },
})
export class StatCardComponent {
  value = input.required<string>();
  label = input.required<string>();
}
