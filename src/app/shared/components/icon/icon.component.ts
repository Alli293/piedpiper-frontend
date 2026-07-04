import { Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS, IconName } from './icon-registry';

export type { IconName };

@Component({
  selector: 'app-icon',
  template: `<span class="ch-icon" [innerHTML]="svg()"></span>`,
  styleUrl: './icon.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ch-icon-host',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class IconComponent {
  name = input.required<IconName>();
  size = input(16);

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly svg = computed(() => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()]));
}
