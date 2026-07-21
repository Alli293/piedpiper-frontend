import { Component, computed, input } from '@angular/core';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4';

@Component({
  selector: 'app-heading',
  templateUrl: './heading.component.html',
  styleUrl: './heading.component.scss',
  host: {
    class: 'ch-heading',
  },
})
export class HeadingComponent {
  level = input.required<HeadingLevel>();
  appearance = input<HeadingLevel>();
  text = input.required<string>();

  protected readonly resolvedAppearance = computed(() => this.appearance() ?? this.level());
}
