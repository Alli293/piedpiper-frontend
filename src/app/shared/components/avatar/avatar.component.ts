import { Component, computed, input } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  host: {
    '[class]': 'hostClass()',
  },
})
export class AvatarComponent {
  initials = input('');
  imageUrl = input('');
  size = input<AvatarSize>('md');

  protected readonly hostClass = computed(() => `ch-avatar ch-avatar--${this.size()}`);
  protected readonly showImage = computed(() => this.imageUrl().length > 0);
}
