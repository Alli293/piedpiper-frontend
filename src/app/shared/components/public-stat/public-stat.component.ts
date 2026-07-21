import { Component, input } from '@angular/core';

@Component({
  selector: 'app-public-stat',
  templateUrl: './public-stat.component.html',
  styleUrl: './public-stat.component.scss',
  host: {
    class: 'ch-public-stat',
  },
})
export class PublicStatComponent {
  value = input.required<string>();
  label = input.required<string>();
}
